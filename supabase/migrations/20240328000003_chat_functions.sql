-- Función para obtener o crear un chat directo entre dos usuarios
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
    WHERE cr.type = 'direct'
    AND cr.organization_id = v_org_id
    AND EXISTS (
        SELECT 1 
        FROM chat_room_members crm1
        JOIN chat_room_members crm2 ON crm1.room_id = crm2.room_id
        WHERE crm1.room_id = cr.id
        AND crm1.user_id = v_current_user_id
        AND crm2.user_id = target_user_id
        AND crm1.status = 'active'
        AND crm2.status = 'active'
    )
    LIMIT 1;

    -- Si no existe, crear uno nuevo
    IF v_room_id IS NULL THEN
        -- Crear la sala
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            is_private
        )
        VALUES (
            v_org_id,
            'Chat Directo',
            'direct',
            v_current_user_id,
            true
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
            updated_at
        )
        VALUES
            (v_room_id, v_current_user_id, v_org_id, 'member', 'active', v_current_user_id, NOW(), NOW()),
            (v_room_id, target_user_id, v_org_id, 'member', 'active', v_current_user_id, NOW(), NOW());
    END IF;

    RETURN v_room_id;
END;
$$;

-- Función para obtener los administradores de una organización
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email
    FROM users u
    WHERE u.organization_id = org_id
    AND u.role = 'admin'
    AND u.status = 'active'
    ORDER BY u.first_name, u.last_name;
END;
$$;

-- Función para obtener las salas de chat de un usuario
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    is_group BOOLEAN,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
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
            cm.content as last_message,
            cm.created_at as last_message_at
        FROM chat_messages cm
        ORDER BY cm.room_id, cm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread_count
        FROM chat_messages cm
        JOIN chat_room_members crm ON cm.room_id = crm.room_id
        WHERE crm.user_id = p_user_id
        AND cm.created_at > COALESCE(crm.last_read_at, '1970-01-01'::timestamptz)
        AND cm.user_id != p_user_id
        GROUP BY cm.room_id
    )
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type != 'direct' as is_group,
        lm.last_message,
        lm.last_message_at,
        COALESCE(uc.unread_count, 0) as unread_count
    FROM chat_rooms cr
    JOIN chat_room_members crm ON cr.id = crm.room_id
    LEFT JOIN last_messages lm ON cr.id = lm.room_id
    LEFT JOIN unread_counts uc ON cr.id = uc.room_id
    WHERE crm.user_id = p_user_id
    AND crm.status = 'active'
    ORDER BY lm.last_message_at DESC NULLS LAST;
END;
$$; 