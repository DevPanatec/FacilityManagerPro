-- Primero, asegurar que las tablas existen y tienen la estructura correcta
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'channel')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_private BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'system', 'file')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'edited', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recrear índices
DROP INDEX IF EXISTS idx_chat_rooms_organization;
DROP INDEX IF EXISTS idx_chat_room_members_room;
DROP INDEX IF EXISTS idx_chat_room_members_user;
DROP INDEX IF EXISTS idx_chat_messages_room;
DROP INDEX IF EXISTS idx_chat_room_members_user_room;
DROP INDEX IF EXISTS idx_chat_room_members_user_status;

CREATE INDEX idx_chat_rooms_organization ON chat_rooms(organization_id);
CREATE INDEX idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE UNIQUE INDEX idx_chat_room_members_user_room ON chat_room_members(user_id, room_id) WHERE status = 'active';
CREATE INDEX idx_chat_room_members_user_status ON chat_room_members(user_id, status);

-- Habilitar RLS en todas las tablas
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Crear nuevas políticas simplificadas
CREATE POLICY "chat_rooms_policy"
ON chat_rooms FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "chat_room_members_policy"
ON chat_room_members FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "chat_messages_policy"
ON chat_messages FOR ALL
USING (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
)
WITH CHECK (
    room_id IN (
        SELECT room_id FROM chat_room_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
    AND user_id = auth.uid()
);

-- Recrear las funciones necesarias
CREATE OR REPLACE FUNCTION get_user_chat_rooms()
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message JSONB,
    unread_count BIGINT,
    member_count BIGINT
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
            jsonb_build_object(
                'id', cm.id,
                'content', cm.content,
                'created_at', cm.created_at,
                'user', jsonb_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name
                )
            ) as message_data
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        ORDER BY cm.room_id, cm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        JOIN chat_room_members crm ON crm.room_id = cm.room_id
        WHERE crm.user_id = auth.uid()
        AND (cm.created_at > crm.last_read_at OR crm.last_read_at IS NULL)
        GROUP BY cm.room_id
    ),
    member_counts AS (
        SELECT 
            room_id,
            COUNT(*) as count
        FROM chat_room_members
        WHERE status = 'active'
        GROUP BY room_id
    )
    SELECT 
        cr.id as room_id,
        cr.name as room_name,
        cr.type as room_type,
        cr.organization_id,
        cr.created_at,
        cr.updated_at,
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(mc.count, 0) as member_count
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id
    LEFT JOIN last_messages lm ON lm.room_id = cr.id
    LEFT JOIN unread_counts uc ON uc.room_id = cr.id
    LEFT JOIN member_counts mc ON mc.room_id = cr.id
    WHERE crm.user_id = auth.uid()
    AND crm.status = 'active'
    ORDER BY COALESCE(lm.message_data->>'created_at', cr.created_at::text) DESC;
END;
$$;

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

CREATE OR REPLACE FUNCTION get_org_admins()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url
    FROM users u
    WHERE u.organization_id = (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    )
    AND u.role = 'admin'
    ORDER BY u.first_name, u.last_name;
END;
$$;

-- Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION get_user_chat_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_chat_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_chat_room_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_admins() TO authenticated;

-- Dar permisos a las tablas
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_room_members TO authenticated;
GRANT ALL ON chat_messages TO authenticated; 