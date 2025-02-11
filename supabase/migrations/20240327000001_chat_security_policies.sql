-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Rooms are viewable by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by organization members" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be updated by admins or owners" ON chat_rooms;
DROP POLICY IF EXISTS "Room members are viewable by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by room creator or admins" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own status" ON chat_room_members;
DROP POLICY IF EXISTS "Members can leave rooms" ON chat_room_members;
DROP POLICY IF EXISTS "Messages are viewable by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be created by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be updated by their creators" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be deleted by their creators" ON chat_messages;
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_update" ON chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_delete" ON chat_room_members;
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_message_attachments_policy" ON chat_message_attachments;
DROP POLICY IF EXISTS "chat_message_reactions_policy" ON chat_message_reactions;
DROP POLICY IF EXISTS "debug_all_access" ON chat_room_members;
DROP POLICY IF EXISTS "debug_messages_access" ON chat_messages;
DROP POLICY IF EXISTS "debug_rooms_access" ON chat_rooms;
DROP POLICY IF EXISTS "members_select" ON chat_room_members;
DROP POLICY IF EXISTS "members_update" ON chat_room_members;
DROP POLICY IF EXISTS "rooms_access" ON chat_rooms;
DROP POLICY IF EXISTS "messages_access" ON chat_messages;
DROP POLICY IF EXISTS "allow_all_authenticated" ON chat_rooms;
DROP POLICY IF EXISTS "allow_all_authenticated" ON chat_room_members;
DROP POLICY IF EXISTS "allow_all_authenticated" ON chat_messages;

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Crear tabla de logs para depuración
CREATE TABLE IF NOT EXISTS chat_debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    user_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para logging
CREATE OR REPLACE FUNCTION log_chat_operation(
    p_operation TEXT,
    p_table_name TEXT,
    p_details JSONB DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO chat_debug_logs (operation, table_name, user_id, details)
    VALUES (p_operation, p_table_name, auth.uid(), p_details);
    RETURN TRUE;
END;
$$;

-- Política única para chat_room_members
DROP POLICY IF EXISTS "chat_room_members_policy" ON chat_room_members;

-- Política única para chat_rooms
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;

-- Política única para chat_messages
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;

-- Políticas para chat_rooms
DROP POLICY IF EXISTS "rooms_select_policy" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON chat_rooms;

-- Políticas para chat_room_members
DROP POLICY IF EXISTS "members_select_policy" ON chat_room_members;
DROP POLICY IF EXISTS "members_insert_policy" ON chat_room_members;
DROP POLICY IF EXISTS "members_update_policy" ON chat_room_members;

-- Políticas para chat_messages
DROP POLICY IF EXISTS "messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "messages_update_policy" ON chat_messages;

-- Habilitar realtime con FULL replica identity
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE chat_room_members REPLICA IDENTITY FULL;

-- Configurar publicación realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    chat_messages,
    chat_rooms,
    chat_room_members
WITH (publish = 'insert,update,delete');

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_room 
ON chat_room_members (user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room 
ON chat_messages (room_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_organization 
ON chat_rooms (organization_id);

-- Políticas para chat_rooms
CREATE POLICY "Rooms are viewable by organization"
ON chat_rooms
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Rooms can be created by authenticated users"
ON chat_rooms
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Políticas para chat_room_members
CREATE POLICY "Members are viewable by organization"
ON chat_room_members
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Members can be added by organization members"
ON chat_room_members
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Members can update their own data"
ON chat_room_members
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Políticas para chat_messages
CREATE POLICY "Messages are viewable by organization"
ON chat_messages
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Messages can be created by room members"
ON chat_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
    AND
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Messages can be updated by their creators"
ON chat_messages
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Función para obtener los chats de un usuario
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
RETURNS TABLE (
    room_id UUID,
    room_name TEXT,
    room_type TEXT,
    room_description TEXT,
    organization_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message JSONB,
    unread_count BIGINT,
    members JSONB[]
) AS $$
BEGIN
    RETURN QUERY
    WITH user_rooms AS (
        SELECT 
            cr.id,
            cr.name,
            cr.type,
            cr.description,
            cr.organization_id,
            cr.created_by,
            cr.created_at,
            cr.updated_at
        FROM chat_rooms cr
        INNER JOIN chat_room_members crm ON cr.id = crm.room_id
        WHERE crm.user_id = p_user_id
        AND crm.status = 'active'
        AND cr.status = 'active'
    ),
    last_messages AS (
        SELECT DISTINCT ON (room_id)
            room_id,
            jsonb_build_object(
                'id', id,
                'content', content,
                'created_at', created_at,
                'user_id', user_id,
                'type', type,
                'file_url', file_url,
                'importance', importance
            ) as message_data
        FROM chat_messages
        WHERE room_id IN (SELECT id FROM user_rooms)
        ORDER BY room_id, created_at DESC
    ),
    unread_counts AS (
        SELECT 
            cm.room_id,
            COUNT(*) as unread
        FROM chat_messages cm
        LEFT JOIN chat_room_members crm 
            ON cm.room_id = crm.room_id 
            AND crm.user_id = p_user_id
        WHERE cm.created_at > COALESCE(crm.last_read_at, '1970-01-01'::timestamp)
        AND cm.user_id != p_user_id
        GROUP BY cm.room_id
    ),
    room_members AS (
        SELECT 
            crm.room_id,
            array_agg(
                jsonb_build_object(
                    'user_id', u.id,
                    'email', u.email,
                    'first_name', u.first_name,
                    'last_name', u.last_name,
                    'role', crm.role,
                    'online_status', COALESCE(
                        (SELECT online_status 
                         FROM chat_messages 
                         WHERE user_id = u.id 
                         ORDER BY created_at DESC 
                         LIMIT 1),
                        'offline'
                    ),
                    'last_seen', COALESCE(
                        (SELECT created_at 
                         FROM chat_messages 
                         WHERE user_id = u.id 
                         ORDER BY created_at DESC 
                         LIMIT 1),
                        NULL
                    )
                )
            ) as members
        FROM chat_room_members crm
        INNER JOIN users u ON crm.user_id = u.id
        WHERE crm.room_id IN (SELECT id FROM user_rooms)
        AND crm.status = 'active'
        GROUP BY crm.room_id
    )
    SELECT 
        ur.id as room_id,
        ur.name as room_name,
        ur.type as room_type,
        ur.description as room_description,
        ur.organization_id,
        ur.created_by,
        ur.created_at,
        ur.updated_at,
        lm.message_data as last_message,
        COALESCE(uc.unread, 0) as unread_count,
        COALESCE(rm.members, ARRAY[]::jsonb[]) as members
    FROM user_rooms ur
    LEFT JOIN last_messages lm ON ur.id = lm.room_id
    LEFT JOIN unread_counts uc ON ur.id = uc.room_id
    LEFT JOIN room_members rm ON ur.id = rm.room_id
    ORDER BY COALESCE(lm.message_data->>'created_at', ur.created_at::text) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_available_admins_for_chat(UUID);

-- Función para obtener administradores disponibles para chat
CREATE FUNCTION get_available_admins_for_chat(p_organization_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT,
    online_status TEXT,
    last_seen TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (m.user_id)
            m.user_id as msg_user_id,
            m.online_status,
            m.created_at
        FROM chat_messages m
        ORDER BY m.user_id, m.created_at DESC
    )
    SELECT 
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.avatar_url,
        u.role,
        COALESCE(lm.online_status, 'offline') as online_status,
        COALESCE(lm.created_at, u.created_at) as last_seen
    FROM users u
    LEFT JOIN latest_messages lm ON lm.msg_user_id = u.id
    WHERE u.role = 'admin'
    AND u.status = 'active'
    AND u.organization_id = p_organization_id
    ORDER BY u.first_name, u.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 