-- Corregir todas las referencias ambiguas en ambas funciones
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
            crm.room_id,
            COUNT(*) as member_count
        FROM chat_room_members crm
        WHERE crm.status = 'active'
        GROUP BY crm.room_id
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
        SELECT DISTINCT ON (m.room_id)
            m.room_id,
            jsonb_build_object(
                'id', m.id,
                'content', m.content,
                'type', m.type,
                'created_at', m.created_at,
                'user_id', m.user_id
            ) as message_data
        FROM chat_messages m
        ORDER BY m.room_id, m.created_at DESC
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
            WHEN v_user_role = 'superadmin' THEN true
            ELSE EXISTS (
                SELECT 1 
                FROM chat_room_members crm 
                WHERE crm.room_id = r.id 
                AND crm.user_id = v_user_id 
                AND crm.status = 'active'
            )
        END
    ORDER BY COALESCE((lm.message_data->>'created_at')::text, r.created_at::text) DESC;
END;
$$;

-- Corregir las referencias ambiguas en la función de mensajes
CREATE OR REPLACE FUNCTION get_chat_room_messages_v1(
    room_uuid UUID,
    msg_limit INTEGER DEFAULT 50,
    msg_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    room_id UUID,
    organization_id UUID,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT
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
    SELECT u.role INTO v_user_role FROM users u WHERE u.id = v_user_id;

    -- Verificar acceso
    IF v_user_role != 'superadmin' AND NOT EXISTS (
        SELECT 1
        FROM chat_room_members crm
        WHERE crm.room_id = room_uuid
        AND crm.user_id = v_user_id
        AND crm.status = 'active'
    ) THEN
        RAISE EXCEPTION 'No tienes acceso a esta sala de chat';
    END IF;

    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.type,
        m.status,
        m.created_at,
        m.updated_at,
        m.user_id,
        m.room_id,
        m.organization_id,
        u.first_name,
        u.last_name,
        u.avatar_url
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.room_id = room_uuid
    ORDER BY m.created_at DESC
    LIMIT msg_limit
    OFFSET msg_offset;
END;
$$; 