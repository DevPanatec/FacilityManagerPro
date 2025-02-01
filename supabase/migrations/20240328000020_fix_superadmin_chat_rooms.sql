-- Corregir la función para que los superadmins vean todos los chats correctamente
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    type TEXT,
    status TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    organization_id UUID,
    member_count BIGINT,
    unread_count BIGINT,
    last_message JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
BEGIN
    -- Obtener el ID y rol del usuario actual
    v_user_id := auth.uid();
    SELECT role INTO v_user_role FROM users WHERE id = v_user_id;

    RETURN QUERY
    WITH room_members AS (
        SELECT 
            room_id,
            COUNT(*) as member_count
        FROM chat_room_members
        WHERE status = 'active'
        GROUP BY room_id
    ),
    unread_messages AS (
        SELECT 
            m.room_id,
            COUNT(*) as unread_count
        FROM chat_messages m
        LEFT JOIN chat_room_members rm ON m.room_id = rm.room_id AND rm.user_id = v_user_id
        WHERE (v_user_role = 'superadmin' OR rm.user_id = v_user_id)
        AND m.created_at > COALESCE(rm.last_read_at, rm.created_at)
        GROUP BY m.room_id
    ),
    last_messages AS (
        SELECT DISTINCT ON (room_id)
            room_id,
            jsonb_build_object(
                'id', id,
                'content', content,
                'type', type,
                'created_at', created_at,
                'user_id', user_id
            ) as message_data
        FROM chat_messages
        ORDER BY room_id, created_at DESC
    )
    SELECT 
        r.id,
        r.name,
        r.description,
        r.type,
        r.status,
        r.created_by,
        r.created_at,
        r.updated_at,
        r.organization_id,
        COALESCE(rm.member_count, 0),
        COALESCE(um.unread_count, 0),
        lm.message_data
    FROM chat_rooms r
    LEFT JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN unread_messages um ON r.id = um.room_id
    LEFT JOIN last_messages lm ON r.id = lm.room_id
    WHERE 
        CASE 
            WHEN v_user_role = 'superadmin' THEN true  -- Superadmin ve todas las salas
            ELSE EXISTS (  -- Otros usuarios solo ven las salas donde son miembros
                SELECT 1 
                FROM chat_room_members crm 
                WHERE crm.room_id = r.id 
                AND crm.user_id = v_user_id 
                AND crm.status = 'active'
            )
        END
    ORDER BY COALESCE(lm.message_data->>'created_at', r.created_at::text) DESC;
END;
$$; 