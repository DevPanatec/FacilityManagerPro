-- Restablecer políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own hospital" ON hospitals;
DROP POLICY IF EXISTS "Users can create their own logs" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON activity_logs;

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para la tabla users
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (
  auth.uid() = id
  OR 
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'superadmin')
  )
);

-- Política para la tabla hospitals
CREATE POLICY "Users can view their own hospital"
ON hospitals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.hospital_id = hospitals.id
    AND u.id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'superadmin')
  )
);

-- Política para la tabla activity_logs
CREATE POLICY "Users can create their own logs"
ON activity_logs
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND auth.role() = 'authenticated'
); 