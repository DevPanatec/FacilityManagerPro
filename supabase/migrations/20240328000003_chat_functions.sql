-- Función para obtener o crear un chat directo entre dos usuarios
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(
    p_organization_id UUID,
    p_user_id_1 UUID,
    p_user_id_2 UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_user_1_name TEXT;
    v_user_2_name TEXT;
    v_room_name TEXT;
BEGIN
    -- Verificar que ambos usuarios pertenecen a la misma organización
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id IN (p_user_id_1, p_user_id_2) 
        AND organization_id = p_organization_id
        GROUP BY organization_id 
        HAVING COUNT(*) = 2
    ) THEN
        RAISE EXCEPTION 'Los usuarios deben pertenecer a la misma organización';
    END IF;

    -- Buscar si ya existe un chat directo entre estos usuarios
    SELECT DISTINCT cr.id INTO v_room_id
    FROM chat_rooms cr
    JOIN chat_room_members crm1 ON cr.id = crm1.room_id
    JOIN chat_room_members crm2 ON cr.id = crm2.room_id
    WHERE cr.type = 'direct'
    AND cr.organization_id = p_organization_id
    AND crm1.user_id = p_user_id_1
    AND crm2.user_id = p_user_id_2;

    -- Si no existe, crear uno nuevo
    IF v_room_id IS NULL THEN
        -- Obtener nombres de usuarios para el nombre de la sala
        SELECT CONCAT(first_name, ' ', last_name) INTO v_user_1_name
        FROM users WHERE id = p_user_id_1;
        
        SELECT CONCAT(first_name, ' ', last_name) INTO v_user_2_name
        FROM users WHERE id = p_user_id_2;

        -- Crear nombre de la sala
        v_room_name := CONCAT(v_user_1_name, ' - ', v_user_2_name);

        -- Crear la sala
        INSERT INTO chat_rooms (
            organization_id,
            name,
            type,
            created_by,
            status
        )
        VALUES (
            p_organization_id,
            v_room_name,
            'direct',
            p_user_id_1,
            'active'
        )
        RETURNING id INTO v_room_id;

        -- Agregar miembros
        INSERT INTO chat_room_members (
            room_id,
            user_id,
            organization_id,
            role,
            status
        )
        VALUES
            (v_room_id, p_user_id_1, p_organization_id, 'member', 'active'),
            (v_room_id, p_user_id_2, p_organization_id, 'member', 'active');
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