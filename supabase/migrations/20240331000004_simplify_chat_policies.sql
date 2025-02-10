-- Eliminar TODAS las políticas existentes
DO $$ 
BEGIN
    -- Eliminar políticas de chat_room_members
    DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_base_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_insert_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_update_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "chat_room_members_select_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_select_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_insert_policy" ON chat_room_members;
    DROP POLICY IF EXISTS "members_update_policy" ON chat_room_members;
    
    -- Eliminar políticas de chat_messages
    DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_base_policy" ON chat_messages;
    DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
    DROP POLICY IF EXISTS "messages_base_policy" ON chat_messages;
END $$;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política simple para miembros de salas de chat
CREATE POLICY "allow_select_members"
ON chat_room_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM chat_room_members my_membership
        WHERE my_membership.room_id = chat_room_members.room_id
        AND my_membership.user_id = auth.uid()
        AND my_membership.status = 'active'
    )
);

CREATE POLICY "allow_insert_members"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "allow_update_members"
ON chat_room_members
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Política simple para mensajes
CREATE POLICY "allow_messages"
ON chat_messages
FOR ALL
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
); 