-- Limpiar datos existentes
DELETE FROM chat_messages;
DELETE FROM chat_room_members;
DELETE FROM chat_rooms;

-- Agregar columnas faltantes
ALTER TABLE chat_rooms 
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN;

ALTER TABLE chat_room_members 
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE chat_messages 
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Asegurar que las tablas tienen las columnas correctas
ALTER TABLE chat_rooms 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL,
    ALTER COLUMN type SET NOT NULL;

ALTER TABLE chat_rooms
    ALTER COLUMN is_private SET DEFAULT true,
    ALTER COLUMN is_private SET NOT NULL;

ALTER TABLE chat_room_members 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN room_id SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'member',
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE chat_messages 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN room_id SET NOT NULL,
    ALTER COLUMN content SET NOT NULL,
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN status SET NOT NULL;

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
CREATE POLICY "Messages are viewable by room members"
ON chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
        AND status = 'active'
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
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Messages can be updated by their creators"
ON chat_messages
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Agregar organization_id a chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Actualizar los organization_id existentes en chat_messages
UPDATE chat_messages m
SET organization_id = r.organization_id
FROM chat_rooms r
WHERE m.room_id = r.id;

-- Hacer organization_id NOT NULL después de la actualización
ALTER TABLE chat_messages
ALTER COLUMN organization_id SET NOT NULL;

-- Asegurar que los estados de los miembros sean correctos
UPDATE chat_room_members
SET status = 'active'
WHERE status IS NULL;

-- Crear índice para mejorar el rendimiento de las consultas de membresía
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_status
ON chat_room_members(user_id, status);

-- Crear función para verificar membresía
CREATE OR REPLACE FUNCTION check_chat_room_membership(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM chat_room_members
        WHERE room_id = p_room_id
        AND user_id = p_user_id
        AND status = 'active'
    );
END;
$$; 