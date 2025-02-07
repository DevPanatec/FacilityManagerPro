-- Corregir la tabla chat_room_members para unificar roles
ALTER TABLE chat_room_members 
DROP CONSTRAINT IF EXISTS chat_room_members_role_check;

ALTER TABLE chat_room_members 
ADD CONSTRAINT chat_room_members_role_check 
CHECK (role IN ('owner', 'admin', 'member'));

-- Actualizar políticas
DROP POLICY IF EXISTS "Usuarios pueden ver chats de su organización" ON chat_rooms;
CREATE POLICY "Usuarios pueden ver chats de su organización"
ON chat_rooms FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Usuarios pueden ver miembros de chats" ON chat_room_members;
CREATE POLICY "Usuarios pueden ver miembros de chats"
ON chat_room_members FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Usuarios pueden gestionar membresías" ON chat_room_members;
CREATE POLICY "Usuarios pueden gestionar membresías"
ON chat_room_members FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Dar permisos a la función RPC
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_chat_membership TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_rooms TO authenticated;

-- Asegurar que la función RPC tiene los permisos necesarios
ALTER FUNCTION ensure_chat_membership(UUID, UUID) SECURITY DEFINER; 