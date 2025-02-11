-- Eliminar la política anterior que causa recursión
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Crear una nueva política más simple y sin recursión
CREATE POLICY "Users can view own data"
ON users FOR SELECT
TO authenticated
USING (
    -- Los usuarios pueden ver su propia información
    id = auth.uid()
    OR
    -- Los usuarios pueden ver a otros usuarios de su misma organización si son enterprise/admin/superadmin
    (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid() 
            AND role IN ('enterprise', 'admin', 'superadmin')
        )
    )
    OR
    -- Los superadmins pueden ver todos los usuarios
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
    )
);

-- Asegurar que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Asegurar permisos básicos
GRANT SELECT ON users TO authenticated;

-- Crear política para insertar usuarios (solo admins y superadmins)
DROP POLICY IF EXISTS "Users can insert users" ON users;
CREATE POLICY "Users can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
);

-- Crear política para actualizar usuarios
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
    )
); 