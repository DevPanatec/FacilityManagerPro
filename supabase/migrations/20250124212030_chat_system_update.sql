-- Update chat_rooms table
ALTER TABLE chat_rooms
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS last_message_id UUID,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_group ON chat_rooms(is_group);

-- Add function to update last message
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last message update
DROP TRIGGER IF EXISTS update_chat_room_last_message_trigger ON chat_messages;
CREATE TRIGGER update_chat_room_last_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_last_message();

-- Add function to get chat rooms for a user
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    is_group BOOLEAN,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as room_id,
        COALESCE(cr.group_name, 
            CASE 
                WHEN cr.is_group THEN cr.group_name
                ELSE (
                    SELECT u.first_name || ' ' || u.last_name
                    FROM users u
                    JOIN chat_room_members crm ON crm.user_id = u.id
                    WHERE crm.room_id = cr.id AND crm.user_id != p_user_id
                    LIMIT 1
                )
            END
        ) as room_name,
        cr.is_group,
        (
            SELECT content
            FROM chat_messages
            WHERE id = cr.last_message_id
        ) as last_message,
        cr.last_message_at,
        COUNT(cm.id) FILTER (WHERE cm.created_at > crm.last_read_at) as unread_count
    FROM chat_rooms cr
    JOIN chat_room_members crm ON cr.id = crm.room_id
    LEFT JOIN chat_messages cm ON cr.id = cm.room_id
    WHERE crm.user_id = p_user_id
    GROUP BY cr.id, cr.group_name, cr.is_group, cr.last_message_id, cr.last_message_at;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Chat rooms can be created by authenticated users" ON chat_rooms;

-- Create new policy for enterprise users only
CREATE POLICY "Chat rooms can be created by enterprise users" ON chat_rooms
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role = 'enterprise'
        )
    );

-- Function to get organization admins
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS SETOF users AS $$
    SELECT u.* 
    FROM users u
    WHERE u.organization_id = org_id 
    AND u.role = 'admin'
    ORDER BY u.first_name, u.last_name;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update chat room creation function to validate enterprise role
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(
    p_organization_id UUID,
    p_user_id_1 UUID,
    p_user_id_2 UUID
) RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
    v_user_1_role TEXT;
BEGIN
    -- Check if user_1 is enterprise
    SELECT role INTO v_user_1_role
    FROM users
    WHERE id = p_user_id_1;

    -- Validate enterprise role
    IF v_user_1_role != 'enterprise' THEN
        RAISE EXCEPTION 'Only enterprise users can create chat rooms';
    END IF;

    -- Check if direct chat already exists
    SELECT r.id INTO v_room_id
    FROM chat_rooms r
    JOIN chat_room_members m1 ON m1.room_id = r.id
    JOIN chat_room_members m2 ON m2.room_id = r.id
    WHERE r.organization_id = p_organization_id
    AND r.type = 'direct'
    AND m1.user_id = p_user_id_1
    AND m2.user_id = p_user_id_2;

    -- If not exists, create new direct chat room
    IF v_room_id IS NULL THEN
        -- Create room
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        ) VALUES (
            p_organization_id,
            'Direct Chat',
            'direct',
            p_user_id_1,
            true
        ) RETURNING id INTO v_room_id;

        -- Add members
        INSERT INTO chat_room_members (room_id, user_id, role)
        VALUES
            (v_room_id, p_user_id_1, 'member'),
            (v_room_id, p_user_id_2, 'member');
    END IF;

    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to enforce organization check
DROP POLICY IF EXISTS "Chat rooms are viewable by members" ON chat_rooms;
CREATE POLICY "Chat rooms are viewable by members" ON chat_rooms
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Chat messages are viewable by room members" ON chat_messages;
CREATE POLICY "Chat messages are viewable by room members" ON chat_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM chat_room_members 
            WHERE room_id = chat_messages.room_id 
            AND user_id = auth.uid()
        )
    ); 