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
    SELECT role INTO v_user_role FROM users WHERE id = v_user_id;

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