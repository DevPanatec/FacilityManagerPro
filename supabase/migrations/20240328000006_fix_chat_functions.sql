-- Actualizar función para obtener o crear un chat directo
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_org_id UUID;
    v_current_user_id UUID;
BEGIN
    -- Obtener el ID del usuario actual
    v_current_user_id := auth.uid();
    
    -- Obtener organization_id del usuario autenticado
    SELECT organization_id INTO v_org_id 
    FROM users 
    WHERE id = v_current_user_id;

    -- Verificar que ambos usuarios pertenecen a la misma organización
    IF NOT EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = target_user_id 
        AND organization_id = v_org_id
    ) THEN
        RAISE EXCEPTION 'Los usuarios deben pertenecer a la misma organización';
    END IF;

    -- Buscar si ya existe un chat directo entre estos usuarios
    SELECT cr.id INTO v_room_id
    FROM chat_rooms cr
    JOIN chat_room_members crm1 ON cr.id = crm1.room_id
    JOIN chat_room_members crm2 ON cr.id = crm2.room_id
    WHERE cr.type = 'direct'
    AND cr.organization_id = v_org_id
    AND crm1.user_id = v_current_user_id
    AND crm2.user_id = target_user_id
    AND crm1.status = 'active'
    AND crm2.status = 'active'
    LIMIT 1;

    -- Si no existe, crear uno nuevo
    IF v_room_id IS NULL THEN
        -- Crear la sala
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private,
            created_at,
            updated_at
        )
        VALUES (
            v_org_id,
            'Chat Directo',
            'direct',
            v_current_user_id,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_room_id;

        -- Agregar miembros con status activo
        INSERT INTO chat_room_members (
            room_id,
            user_id,
            organization_id,
            role,
            status,
            created_by,
            created_at,
            updated_at,
            last_read_at
        )
        VALUES
            (v_room_id, v_current_user_id, v_org_id, 'member', 'active', v_current_user_id, NOW(), NOW(), NOW()),
            (v_room_id, target_user_id, v_org_id, 'member', 'active', v_current_user_id, NOW(), NOW(), NOW());
    END IF;

    RETURN v_room_id;
END;
$$;

-- Actualizar función para obtener mensajes
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
AS $$
BEGIN
    -- Verificar membresía
    IF NOT EXISTS (
        SELECT 1
        FROM chat_room_members
        WHERE room_id = p_room_id
        AND user_id = auth.uid()
        AND status = 'active'
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
    WHERE m.room_id = p_room_id
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$; 