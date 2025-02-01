-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver miembros de sus salas" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios registros" ON chat_room_members;
DROP POLICY IF EXISTS "Usuarios pueden marcar como leído" ON chat_room_members;

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS update_chat_room_member_last_read_trigger ON chat_room_members;
DROP FUNCTION IF EXISTS update_chat_room_member_last_read();

-- Asegurarnos que RLS está habilitado
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Política simple para SELECT
CREATE POLICY "Enable read access for authenticated users"
ON chat_room_members
FOR SELECT
TO authenticated
USING (true);

-- Política simple para UPDATE
CREATE POLICY "Enable update for users based on user_id"
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
);

-- Nueva función para el trigger
CREATE OR REPLACE FUNCTION update_chat_room_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Siempre actualizamos last_read_at en cualquier UPDATE
    IF TG_OP = 'UPDATE' THEN
        NEW.last_read_at = CURRENT_TIMESTAMP;
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nuevo trigger
CREATE TRIGGER update_chat_room_member_trigger
    BEFORE UPDATE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_member();

-- Asegurar que la tabla tiene los campos necesarios
DO $$ 
BEGIN
    -- Agregar columna updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_room_members' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE chat_room_members 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$; 