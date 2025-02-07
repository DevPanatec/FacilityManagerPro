-- Corregir la función get_org_admins
CREATE OR REPLACE FUNCTION get_org_admins()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url
    FROM users u
    WHERE u.organization_id = (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
    AND u.role = 'admin';
END;
$$;

-- Asegurar que RLS está habilitado en todas las tablas del chat
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Actualizar políticas RLS para chat_rooms
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_policy"
ON chat_rooms FOR ALL
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

-- Actualizar políticas RLS para chat_room_members
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
CREATE POLICY "chat_room_members_policy"
ON chat_room_members FOR ALL
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

-- Actualizar políticas RLS para chat_messages
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
CREATE POLICY "chat_messages_policy"
ON chat_messages FOR ALL
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

-- Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION get_org_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_chat_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_chat_room_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Dar permisos a las tablas
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON users TO authenticated; 