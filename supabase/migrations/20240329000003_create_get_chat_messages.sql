-- Eliminar funciones anteriores si existen
DROP FUNCTION IF EXISTS get_chat_room_messages_v1(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_chat_room_messages_v2(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_chat_messages(UUID, INTEGER, INTEGER);

-- Crear la función para obtener mensajes de chat
CREATE OR REPLACE FUNCTION get_chat_messages(
    p_room_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
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
    v_organization_id UUID;
BEGIN
    -- Obtener información del usuario actual
    v_user_id := auth.uid();
    
    SELECT role, organization_id INTO v_user_role, v_organization_id
    FROM users
    WHERE id = v_user_id;

    -- Verificar que el usuario tenga acceso al chat room
    IF NOT EXISTS (
        SELECT 1 
        FROM chat_room_members 
        WHERE room_id = p_room_id 
        AND user_id = v_user_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'No tienes acceso a esta sala de chat';
    END IF;

    RETURN QUERY
    SELECT 
        cm.id,
        cm.content,
        cm.type,
        cm.status,
        cm.created_at,
        cm.updated_at,
        cm.user_id,
        cm.room_id,
        cm.organization_id,
        u.first_name,
        u.last_name,
        u.avatar_url
    FROM chat_messages cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.room_id = p_room_id
    ORDER BY cm.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;

    -- Actualizar last_read_at para el usuario actual
    UPDATE chat_room_members
    SET last_read_at = NOW()
    WHERE room_id = p_room_id
    AND user_id = v_user_id;
END;
$$; 