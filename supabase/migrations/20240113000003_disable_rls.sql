-- Deshabilitar RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Dar permisos al rol anon
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated; 