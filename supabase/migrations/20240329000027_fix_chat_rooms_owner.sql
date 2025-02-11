-- Eliminar la función existente
DROP FUNCTION IF EXISTS get_user_chat_rooms();

-- Recrear la función sin parámetros
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    organization_id UUID,
    last_message JSONB,
    unread_count BIGINT,
    member_count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Obtener el ID del usuario actual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No hay usuario autenticado';
    END IF;

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
        WHERE crm.user_id = v_user_id
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
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(mc.count, 0) as member_count,
        cr.created_at,
        cr.updated_at
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    LEFT JOIN last_messages lm ON lm.room_id = cr.id
    LEFT JOIN unread_counts uc ON uc.room_id = cr.id
    LEFT JOIN member_counts mc ON mc.room_id = cr.id
    WHERE crm.user_id = v_user_id
    AND crm.status = 'active'
    ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC;
END;
$$;

-- Asegurar que el owner es postgres
ALTER FUNCTION get_user_chat_rooms() OWNER TO postgres;

-- Revocar todos los permisos existentes
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM authenticated;

-- Dar permisos específicos
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Asegurar permisos en las tablas necesarias
GRANT SELECT ON chat_rooms TO authenticated;
GRANT SELECT ON chat_room_members TO authenticated;
GRANT SELECT ON chat_messages TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Asegurar que RLS está habilitado
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Actualizar políticas RLS
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_policy" ON chat_rooms
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;
CREATE POLICY "chat_room_members_policy" ON chat_room_members
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
CREATE POLICY "chat_messages_policy" ON chat_messages
    FOR ALL
    TO authenticated
    USING (
        room_id IN (
            SELECT room_id FROM chat_room_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    ); 