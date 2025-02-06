-- Eliminar funciones anteriores si existen
DROP FUNCTION IF EXISTS get_chat_messages_v2(UUID, INTEGER, INTEGER);

-- Crear la función para obtener mensajes de chat con paginación
CREATE OR REPLACE FUNCTION get_chat_messages_v2(
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
    v_organization_id UUID;
BEGIN
    -- Obtener información del usuario actual
    v_user_id := auth.uid();
    
    SELECT u.role, u.organization_id INTO v_user_role, v_organization_id
    FROM users u
    WHERE u.id = v_user_id;

    -- Verificar que el usuario tenga acceso al chat room
    IF NOT EXISTS (
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
    WHERE cm.room_id = room_uuid
    ORDER BY cm.created_at DESC
    LIMIT msg_limit
    OFFSET msg_offset;

    -- Actualizar last_read_at para el usuario actual
    UPDATE chat_room_members crm
    SET last_read_at = NOW()
    WHERE crm.room_id = room_uuid
    AND crm.user_id = v_user_id;
END;
$$; 