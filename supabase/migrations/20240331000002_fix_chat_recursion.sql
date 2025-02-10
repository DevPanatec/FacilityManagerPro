-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "chat_room_members_base_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_update_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_select_policy" ON chat_room_members;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Política simplificada para SELECT
CREATE POLICY "members_select_policy"
ON chat_room_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política simplificada para INSERT
CREATE POLICY "members_insert_policy"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política simplificada para UPDATE
CREATE POLICY "members_update_policy"
ON chat_room_members
FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM chat_room_members crm
        WHERE crm.room_id = chat_room_members.room_id
        AND crm.user_id = auth.uid()
        AND crm.role = 'admin'
    )
);

-- Política simplificada para mensajes
DROP POLICY IF EXISTS "chat_messages_base_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

CREATE POLICY "messages_base_policy"
ON chat_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM chat_room_members crm
        WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = auth.uid()
        AND crm.status = 'active'
    )
); 