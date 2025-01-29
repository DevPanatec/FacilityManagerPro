-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear políticas
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (
    auth.uid() = id
    OR
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'admin')
    )
);

CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
USING (
    auth.uid() = id
    OR
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'admin')
    )
)
WITH CHECK (
    auth.uid() = id
    OR
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'admin')
    )
);

-- Permitir que el service role acceda a todo
CREATE POLICY "Service role has full access"
ON users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role'); 