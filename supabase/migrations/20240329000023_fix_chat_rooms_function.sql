-- Recrear la función get_user_chat_rooms con los permisos correctos
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

-- Asegurar que la función tiene los permisos correctos
REVOKE ALL ON FUNCTION get_user_chat_rooms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;

-- Asegurar que las tablas relacionadas tienen los permisos correctos
GRANT SELECT ON chat_rooms TO authenticated;
GRANT SELECT ON chat_messages TO authenticated;
GRANT SELECT ON chat_room_members TO authenticated;
GRANT SELECT ON users TO authenticated; 