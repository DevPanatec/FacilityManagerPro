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
AS $$
BEGIN
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
        JOIN chat_room_members rm ON m.room_id = rm.room_id
        WHERE rm.user_id = auth.uid()
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
    JOIN chat_room_members crm ON r.id = crm.room_id
    LEFT JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN unread_messages um ON r.id = um.room_id
    LEFT JOIN last_messages lm ON r.id = lm.room_id
    WHERE crm.user_id = auth.uid()
    AND crm.status = 'active'
    ORDER BY COALESCE(lm.message_data->>'created_at', r.created_at::text) DESC;
END;
$$;

-- Función para obtener los mensajes de una sala
CREATE OR REPLACE FUNCTION get_room_messages(
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
    user_info JSONB,
    attachments JSONB[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar membresía
    IF NOT check_chat_room_membership(p_room_id, auth.uid()) THEN
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
        jsonb_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'avatar_url', u.avatar_url
        ) as user_info,
        ARRAY_AGG(
            CASE WHEN a.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', a.id,
                    'file_url', a.file_url,
                    'file_type', a.file_type,
                    'file_name', a.file_name,
                    'file_size', a.file_size
                )
            ELSE NULL
            END
        ) FILTER (WHERE a.id IS NOT NULL) as attachments
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN chat_message_attachments a ON m.id = a.message_id
    WHERE m.room_id = p_room_id
    GROUP BY 
        m.id, m.content, m.type, m.status, 
        m.created_at, m.updated_at, m.user_id, 
        m.room_id, m.organization_id,
        u.id, u.first_name, u.last_name, u.avatar_url
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$; 