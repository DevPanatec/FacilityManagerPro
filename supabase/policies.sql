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

-- Política simplificada para la tabla users
CREATE POLICY "Enable read access for users"
ON users
FOR SELECT
USING (
  -- El usuario puede ver su propio registro
  auth.uid() = id
  OR
  -- Los admin/superadmin pueden ver todos los registros
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
  )
);

-- Política para la tabla hospitals
CREATE POLICY "Enable read access for hospitals"
ON hospitals
FOR SELECT
USING (true);  -- Todos los usuarios autenticados pueden ver hospitales

-- Política para la tabla activity_logs
CREATE POLICY "Enable insert for own logs"
ON activity_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
); 