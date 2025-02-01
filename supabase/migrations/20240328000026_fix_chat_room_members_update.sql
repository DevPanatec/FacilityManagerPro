-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON chat_room_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON chat_room_members;
DROP TRIGGER IF EXISTS update_chat_room_member_trigger ON chat_room_members;
DROP FUNCTION IF EXISTS update_chat_room_member();

-- Habilitar RLS
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "chat_room_members_select"
ON chat_room_members
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE
CREATE POLICY "chat_room_members_update"
ON chat_room_members
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'superadmin'
    )
)
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'superadmin'
    )
);

-- Función para actualizar last_read_at
CREATE OR REPLACE FUNCTION update_chat_room_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Asegurarnos de que last_read_at y updated_at se actualizan
    NEW.last_read_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar automáticamente last_read_at y updated_at
CREATE TRIGGER update_chat_room_member_trigger
    BEFORE UPDATE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_member();

-- Función RPC para marcar como leído
CREATE OR REPLACE FUNCTION mark_chat_room_as_read(
    p_room_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE chat_room_members
    SET last_read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE room_id = p_room_id
    AND user_id = auth.uid();
END;
$$; 