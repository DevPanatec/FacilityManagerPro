-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_user_chat_rooms(UUID);

-- Actualizar la función get_user_chat_rooms para incluir información del otro usuario
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    is_group BOOLEAN,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    other_user_id UUID,
    other_user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH user_rooms AS (
        SELECT 
            crm.room_id,
            crm.last_read_at,
            cr.name as room_name,
            cr.type,
            CASE 
                WHEN cr.type = 'direct' THEN (
                    SELECT json_build_object(
                        'id', u.id,
                        'name', COALESCE(u.first_name || ' ' || u.last_name, u.email)
                    )
                    FROM chat_room_members other_crm
                    JOIN users u ON u.id = other_crm.user_id
                    WHERE other_crm.room_id = cr.id 
                    AND other_crm.user_id != p_user_id
                    LIMIT 1
                )
                ELSE NULL
            END as other_user_info
        FROM chat_room_members crm
        JOIN chat_rooms cr ON cr.id = crm.room_id
        WHERE crm.user_id = p_user_id
        AND crm.status = 'active'
    )
    SELECT 
        ur.room_id,
        CASE 
            WHEN ur.type = 'direct' AND ur.other_user_info IS NOT NULL 
            THEN (ur.other_user_info->>'name')::TEXT
            ELSE ur.room_name
        END as room_name,
        ur.type = 'group' as is_group,
        COALESCE(last_msg.content, '') as last_message,
        COALESCE(last_msg.created_at, ur.last_read_at) as last_message_at,
        COALESCE(unread.count, 0) as unread_count,
        CASE 
            WHEN ur.type = 'direct' THEN (ur.other_user_info->>'id')::UUID
            ELSE NULL
        END as other_user_id,
        CASE 
            WHEN ur.type = 'direct' THEN (ur.other_user_info->>'name')::TEXT
            ELSE NULL
        END as other_user_name
    FROM user_rooms ur
    LEFT JOIN LATERAL (
        SELECT 
            cm.content,
            cm.created_at
        FROM chat_messages cm
        WHERE cm.room_id = ur.room_id
        ORDER BY cm.created_at DESC
        LIMIT 1
    ) last_msg ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM chat_messages cm
        WHERE cm.room_id = ur.room_id
        AND cm.created_at > ur.last_read_at
    ) unread ON true
    ORDER BY COALESCE(last_msg.created_at, ur.last_read_at) DESC;
END;
$$; 