-- Drop existing tables if they exist
DROP TABLE IF EXISTS chat_message_reactions CASCADE;
DROP TABLE IF EXISTS chat_message_attachments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_room_members CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'channel')),
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    is_group BOOLEAN DEFAULT false,
    group_name TEXT,
    last_message_id UUID,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat room members table
CREATE TABLE IF NOT EXISTS chat_room_members (
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_organization ON chat_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_org ON chat_room_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org ON chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Acceso a salas" ON chat_rooms;
DROP POLICY IF EXISTS "Crear salas" ON chat_rooms;
DROP POLICY IF EXISTS "Actualizar ultimo mensaje" ON chat_rooms;
DROP POLICY IF EXISTS "Ver miembros" ON chat_room_members;
DROP POLICY IF EXISTS "Actualizar last_read" ON chat_room_members;
DROP POLICY IF EXISTS "Agregar miembros" ON chat_room_members;
DROP POLICY IF EXISTS "Leer mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Enviar mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Eliminar mensajes propios" ON chat_messages;
DROP POLICY IF EXISTS "Enterprise elimina mensajes" ON chat_messages;

-- Chat rooms policies
CREATE POLICY "Acceso a salas"
ON chat_rooms
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_rooms.id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Crear salas"
ON chat_rooms
FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Actualizar ultimo mensaje"
ON chat_rooms
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = id
        AND user_id = auth.uid()
    )
);

-- Chat room members policies
CREATE POLICY "Ver miembros"
ON chat_room_members
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Actualizar last_read"
ON chat_room_members
FOR UPDATE USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

CREATE POLICY "Agregar miembros"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'enterprise'
    )
);

-- Chat messages policies
CREATE POLICY "Leer mensajes"
ON chat_messages
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enviar mensajes"
ON chat_messages
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Eliminar mensajes propios"
ON chat_messages
FOR DELETE USING (
    user_id = auth.uid()
);

CREATE POLICY "Enterprise elimina mensajes"
ON chat_messages
FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'enterprise'
    )
);

-- Update existing data
UPDATE chat_room_members crm
SET organization_id = u.organization_id
FROM users u
WHERE crm.user_id = u.id;

-- Grant permissions
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        CASE 
            WHEN cr.is_group THEN cr.group_name
            ELSE (
                SELECT first_name || ' ' || last_name
                FROM users u
                JOIN chat_room_members other_members ON other_members.user_id = u.id
                WHERE other_members.room_id = cr.id 
                AND other_members.user_id != p_user_id
                LIMIT 1
            )
        END as room_name,
        cr.is_group,
        (
            SELECT content
            FROM chat_messages
            WHERE id = cr.last_message_id
        ) as last_message,
        cr.last_message_at,
        COUNT(cm.id) FILTER (
            WHERE cm.created_at > COALESCE(members.last_read_at, '1970-01-01'::timestamptz)
        ) as unread_count
    FROM chat_rooms cr
    JOIN chat_room_members members ON members.room_id = cr.id
    LEFT JOIN chat_messages cm ON cm.room_id = cr.id
    WHERE members.user_id = p_user_id
    GROUP BY cr.id, cr.group_name, cr.is_group, cr.last_message_id, cr.last_message_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization admins
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
    FROM users u
    WHERE u.organization_id = org_id 
    AND u.role = 'admin'
    ORDER BY u.first_name, u.last_name;
$$;

-- Update chat room creation function with definitive solution
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(target_user_id uuid)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    _room_id uuid;
    _current_user_org_id uuid;
    _target_user_org_id uuid;
BEGIN
    -- Get organization_id for both authenticated user and target user
    SELECT organization_id INTO _current_user_org_id FROM users WHERE id = auth.uid();
    SELECT organization_id INTO _target_user_org_id FROM users WHERE id = target_user_id;

    -- Verify same organization
    IF _current_user_org_id != _target_user_org_id THEN
        RAISE EXCEPTION 'Users must belong to the same organization';
    END IF;

    -- Find existing direct chat room
    SELECT crm.room_id INTO _room_id 
    FROM chat_room_members crm
    INNER JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE 
        crm.user_id = auth.uid() 
        AND cr.type = 'direct'
        AND cr.organization_id = _current_user_org_id
        AND EXISTS (
            SELECT 1 
            FROM chat_room_members 
            WHERE room_id = crm.room_id 
            AND user_id = target_user_id
        )
    LIMIT 1;

    -- If not exists, create new direct chat room
    IF _room_id IS NULL THEN
        -- Create room
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        ) VALUES (
            _current_user_org_id,
            'Direct Chat',
            'direct',
            auth.uid(),
            true
        ) RETURNING id INTO _room_id;

        -- Add members WITH organization_id
        INSERT INTO chat_room_members (
            room_id,
            user_id,
            organization_id,
            role
        ) VALUES 
            (_room_id, auth.uid(), _current_user_org_id, 'member'),
            (_room_id, target_user_id, _current_user_org_id, 'member');
    END IF;

    RETURN _room_id;
END;
$$;

-- Ensure organization_id is NOT NULL
ALTER TABLE chat_room_members
ALTER COLUMN organization_id SET NOT NULL;

-- Update existing records if any are missing organization_id
UPDATE chat_room_members crm
SET organization_id = u.organization_id
FROM users u
WHERE crm.user_id = u.id
AND crm.organization_id IS NULL;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_user_org();
DROP FUNCTION IF EXISTS is_user_in_room(uuid);

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_admins(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_direct_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_chat_room_last_message() TO authenticated;

-- Drop tables from publication first (if they exist)
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
    EXCEPTION 
        WHEN undefined_object THEN 
            NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_rooms;
    EXCEPTION 
        WHEN undefined_object THEN 
            NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE chat_room_members;
    EXCEPTION 
        WHEN undefined_object THEN 
            NULL;
    END;
END $$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;

-- Enable realtime for specific columns
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE chat_room_members REPLICA IDENTITY FULL; 