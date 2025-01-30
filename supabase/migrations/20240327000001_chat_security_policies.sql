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