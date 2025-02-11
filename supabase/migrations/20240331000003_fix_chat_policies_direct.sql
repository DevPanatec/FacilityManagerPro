-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "chat_room_members_base_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_update_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_select_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_base_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política única para chat_room_members
CREATE POLICY "chat_room_members_policy"
ON chat_room_members
FOR ALL
USING (
    -- El usuario puede ver/modificar sus propias membresías
    user_id = auth.uid()
    OR
    -- O el usuario pertenece a la misma organización
    organization_id IN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Política única para chat_messages
CREATE POLICY "chat_messages_policy"
ON chat_messages
FOR ALL
USING (
    -- El usuario puede ver/modificar sus propios mensajes
    user_id = auth.uid()
    OR
    -- O el usuario es miembro activo de la sala
    EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
); 