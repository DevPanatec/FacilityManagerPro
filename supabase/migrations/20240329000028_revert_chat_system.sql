-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden ver chats de su organización" ON chat_rooms;
DROP POLICY IF EXISTS "Usuarios pueden ver miembros de chats" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden gestionar membresías" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes a sus chats" ON chat_messages;
DROP POLICY IF EXISTS "Enable read access for users in same organization" ON chat_rooms;
DROP POLICY IF EXISTS "Enable insert for users in same organization" ON chat_rooms;
DROP POLICY IF EXISTS "Enable read for organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Enable insert for organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Enable update for own membership" ON chat_room_members;
DROP POLICY IF EXISTS "Enable read for room members" ON chat_messages;
DROP POLICY IF EXISTS "Enable insert for room members" ON chat_messages;
DROP POLICY IF EXISTS "Enable update for message creators" ON chat_messages;

-- Restaurar las políticas originales
CREATE POLICY "Usuarios pueden ver chats de su organización"
ON chat_rooms FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Usuarios pueden ver miembros de chats"
ON chat_room_members FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

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

-- Políticas para mensajes
CREATE POLICY "Usuarios pueden ver mensajes de sus chats"
ON chat_messages FOR SELECT TO authenticated
USING (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

CREATE POLICY "Usuarios pueden enviar mensajes a sus chats"
ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
    AND user_id = auth.uid()
);

-- Restaurar la función get_user_chat_rooms
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

-- Asegurar permisos correctos
ALTER FUNCTION get_user_chat_rooms() OWNER TO postgres;
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Asegurar permisos en las tablas
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Habilitar realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE chat_room_members REPLICA IDENTITY FULL;

-- Configurar publicación realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    chat_messages,
    chat_rooms,
    chat_room_members
WITH (publish = 'insert,update,delete'); 