-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir a los usuarios ver sus propios datos
CREATE POLICY "Enable read access for authenticated users"
ON users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Crear política para permitir a los usuarios actualizar sus propios datos
CREATE POLICY "Enable update for users based on id"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Crear política para permitir al service role hacer todo
CREATE POLICY "Enable all access for service role"
ON users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role'); 