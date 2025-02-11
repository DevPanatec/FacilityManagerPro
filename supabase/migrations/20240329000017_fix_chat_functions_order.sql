-- Primero creamos todas las funciones
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message JSONB,
    unread_count BIGINT,
    member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (cm.room_id)
            cm.room_id,
            jsonb_build_object(
                'id', cm.id,
                'content', cm.content,
                'created_at', cm.created_at,
                'user', jsonb_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name
                )
            ) as message_data
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        ORDER BY cm.room_id, cm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        JOIN chat_room_members crm ON crm.room_id = cm.room_id
        WHERE crm.user_id = auth.uid()
        AND (cm.created_at > crm.last_read_at OR crm.last_read_at IS NULL)
        GROUP BY cm.room_id
    ),
    member_counts AS (
        SELECT 
            room_id,
            COUNT(*) as count
        FROM chat_room_members
        WHERE status = 'active'
        GROUP BY room_id
    )
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type as room_type,
        cr.organization_id,
        cr.created_at,
        cr.updated_at,
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(mc.count, 0) as member_count
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    LEFT JOIN last_messages lm ON lm.room_id = cr.id
    LEFT JOIN unread_counts uc ON uc.room_id = cr.id
    LEFT JOIN member_counts mc ON mc.room_id = cr.id
    WHERE crm.user_id = auth.uid()
    AND crm.status = 'active'
    ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC;
END;
$$;

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
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE ur.role = 'admin'
    AND u.organization_id = (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
    ORDER BY u.first_name, u.last_name;
END;
$$;

-- Ahora sí podemos revocar permisos
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Otorgar permisos específicos
GRANT EXECUTE ON FUNCTION ensure_chat_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_chat_room_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_admins() TO authenticated;

-- Asegurar permisos en las tablas necesarias
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_roles TO authenticated;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

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