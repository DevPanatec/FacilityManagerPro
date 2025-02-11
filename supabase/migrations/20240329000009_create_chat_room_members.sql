-- Crear tabla de miembros de chat rooms
CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    UNIQUE(room_id, user_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_org_id ON chat_room_members(organization_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_room_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_members_updated_at
    BEFORE UPDATE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_members_updated_at();

-- Habilitar RLS
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY; 