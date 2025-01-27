-- Drop existing function
DROP FUNCTION IF EXISTS get_org_admins(UUID);

-- Function to get organization admins
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT
) AS $$
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
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Chat rooms are viewable by members" ON chat_rooms;
DROP POLICY IF EXISTS "Chat rooms can be created by enterprise users" ON chat_rooms;
DROP POLICY IF EXISTS "Chat messages are viewable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in rooms they belong to" ON chat_messages;
DROP POLICY IF EXISTS "Room members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON chat_room_members;
DROP POLICY IF EXISTS "Enterprise users can add members" ON chat_room_members;

-- Create policies for chat_rooms
CREATE POLICY "Chat rooms are viewable by members" ON chat_rooms
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Create policies for chat_messages
CREATE POLICY "Chat messages are viewable by room members" ON chat_messages
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        room_id IN (
            SELECT room_id 
            FROM chat_room_members 
            WHERE user_id = auth.uid()
        )
    );

-- Create policies for chat_room_members
CREATE POLICY "Room members are viewable by organization members" ON chat_room_members
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        room_id IN (
            SELECT id 
            FROM chat_rooms 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own membership" ON chat_room_members
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        user_id = auth.uid()
    );

CREATE POLICY "Enterprise users can manage members" ON chat_room_members
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'enterprise'
        )
    ); 