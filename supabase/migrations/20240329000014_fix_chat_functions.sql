-- Eliminar funciones anteriores si existen
DROP FUNCTION IF EXISTS get_chat_messages_v2(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS ensure_chat_membership(UUID, UUID);
DROP FUNCTION IF EXISTS mark_chat_room_as_read(UUID);

-- Función para obtener mensajes
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
BEGIN
    -- Verificar que el usuario tenga acceso al chat room
    IF NOT EXISTS (
        SELECT 1 
        FROM chat_room_members crm
        WHERE crm.room_id = room_uuid 
        AND crm.user_id = auth.uid() 
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
END;
$$;

-- Función para asegurar membresía
CREATE OR REPLACE FUNCTION ensure_chat_membership(
    p_room_id UUID,
    p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_organization_id UUID;
    v_membership RECORD;
    v_is_new BOOLEAN := false;
BEGIN
    -- Obtener el organization_id del usuario
    SELECT organization_id INTO v_organization_id
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Verificar si el chat room existe y pertenece a la misma organización
    IF NOT EXISTS (
        SELECT 1 
        FROM chat_rooms 
        WHERE id = p_room_id 
        AND organization_id = v_organization_id
    ) THEN
        RAISE EXCEPTION 'Chat room no encontrado o no tienes acceso';
    END IF;

    -- Verificar si ya existe una membresía
    SELECT * INTO v_membership
    FROM chat_room_members
    WHERE room_id = p_room_id
    AND user_id = p_user_id;

    -- Si no existe, crear una nueva
    IF NOT FOUND THEN
        INSERT INTO chat_room_members (
            room_id,
            user_id,
            organization_id,
            role,
            status,
            created_by
        )
        VALUES (
            p_room_id,
            p_user_id,
            v_organization_id,
            'member',
            'active',
            p_user_id
        )
        RETURNING * INTO v_membership;
        
        v_is_new := true;
    ELSE
        -- Asegurar que la membresía esté activa
        IF v_membership.status != 'active' THEN
            UPDATE chat_room_members
            SET status = 'active'
            WHERE id = v_membership.id
            RETURNING * INTO v_membership;
            
            v_is_new := true;
        END IF;
    END IF;

    RETURN json_build_object(
        'membership', v_membership,
        'is_new', v_is_new
    );
END;
$$;

-- Función para marcar como leído
CREATE OR REPLACE FUNCTION mark_chat_room_as_read(
    p_room_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE chat_room_members
    SET last_read_at = NOW()
    WHERE room_id = p_room_id
    AND user_id = auth.uid();
END;
$$;

-- Dar permisos a las funciones
REVOKE ALL ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION ensure_chat_membership(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_chat_room_as_read(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_chat_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_chat_room_as_read(UUID) TO authenticated; 