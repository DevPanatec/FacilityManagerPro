-- Revocar todos los permisos existentes
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Asegurar que las funciones son SECURITY DEFINER
ALTER FUNCTION ensure_chat_membership(UUID, UUID) SECURITY DEFINER;
ALTER FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) SECURITY DEFINER;
ALTER FUNCTION mark_chat_room_as_read(UUID) SECURITY DEFINER;

-- Establecer el search_path seguro
ALTER FUNCTION ensure_chat_membership(UUID, UUID) SET search_path = public;
ALTER FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION mark_chat_room_as_read(UUID) SET search_path = public;

-- Otorgar permisos específicos
GRANT EXECUTE ON FUNCTION ensure_chat_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_chat_room_as_read(UUID) TO authenticated;

-- Asegurar permisos en las tablas necesarias
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para ver chats
DROP POLICY IF EXISTS "Ver chats de su organización" ON chat_rooms;
CREATE POLICY "Ver chats de su organización"
ON chat_rooms FOR ALL TO authenticated
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

-- Política para membresías
DROP POLICY IF EXISTS "Gestionar membresías de su organización" ON chat_room_members;
CREATE POLICY "Gestionar membresías de su organización"
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

-- Política para mensajes
DROP POLICY IF EXISTS "Gestionar mensajes de sus chats" ON chat_messages;
CREATE POLICY "Gestionar mensajes de sus chats"
ON chat_messages FOR ALL TO authenticated
USING (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
)
WITH CHECK (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
    AND user_id = auth.uid()
); 