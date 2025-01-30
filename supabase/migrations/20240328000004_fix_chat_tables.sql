-- Limpiar datos existentes
DELETE FROM chat_messages;
DELETE FROM chat_room_members;
DELETE FROM chat_rooms;

-- Asegurar que las tablas tienen las columnas correctas
ALTER TABLE chat_rooms 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN is_private SET NOT NULL DEFAULT true;

ALTER TABLE chat_room_members 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN room_id SET NOT NULL,
    ALTER COLUMN status SET NOT NULL DEFAULT 'active',
    ALTER COLUMN role SET NOT NULL DEFAULT 'member',
    ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE chat_messages 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN room_id SET NOT NULL,
    ALTER COLUMN content SET NOT NULL;

-- Recrear índices
DROP INDEX IF EXISTS idx_chat_room_members_user_room;
DROP INDEX IF EXISTS idx_chat_messages_room;
DROP INDEX IF EXISTS idx_chat_rooms_organization;

CREATE UNIQUE INDEX idx_chat_room_members_user_room 
ON chat_room_members (user_id, room_id) 
WHERE status = 'active';

CREATE INDEX idx_chat_messages_room 
ON chat_messages (room_id, created_at DESC);

CREATE INDEX idx_chat_rooms_organization 
ON chat_rooms (organization_id, type);

-- Habilitar RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Recrear políticas
DROP POLICY IF EXISTS "Rooms are viewable by organization" ON chat_rooms;
DROP POLICY IF EXISTS "Rooms can be created by authenticated users" ON chat_rooms;
DROP POLICY IF EXISTS "Members are viewable by organization" ON chat_room_members;
DROP POLICY IF EXISTS "Members can be added by organization members" ON chat_room_members;
DROP POLICY IF EXISTS "Members can update their own data" ON chat_room_members;
DROP POLICY IF EXISTS "Messages are viewable by organization" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be created by room members" ON chat_messages;
DROP POLICY IF EXISTS "Messages can be updated by their creators" ON chat_messages;

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