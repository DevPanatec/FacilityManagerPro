-- Restaurar políticas básicas para la tabla users
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
ON users FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR
    -- Enterprise users can see admins in their organization
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'enterprise'
        AND u.organization_id = users.organization_id
    )
    OR
    -- Admins can see users in their organization
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'superadmin')
        AND u.organization_id = users.organization_id
    )
);

-- Restaurar políticas básicas para organizations
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
CREATE POLICY "Organizations are viewable by members"
ON organizations FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid()
    )
);

-- Restaurar políticas básicas para salas
DROP POLICY IF EXISTS "Salas are viewable by organization members" ON salas;
CREATE POLICY "Salas are viewable by organization members"
ON salas FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid()
    )
);

-- Restaurar políticas básicas para tasks
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;
CREATE POLICY "Tasks are viewable by organization members"
ON tasks FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid()
    )
);

-- Asegurar que RLS está habilitado en todas las tablas principales
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Asegurar permisos básicos para usuarios autenticados
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON salas TO authenticated;
GRANT SELECT ON tasks TO authenticated;

-- Restaurar función get_org_admins
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Obtener el rol del usuario actual
    SELECT role INTO v_user_role FROM users WHERE id = auth.uid();
    
    -- Verificar que el usuario sea enterprise y pertenezca a la organización
    IF v_user_role = 'enterprise' THEN
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND organization_id = org_id
        ) THEN
            RAISE EXCEPTION 'No tienes permiso para ver los administradores de esta organización';
        END IF;
    END IF;

    RETURN QUERY
    SELECT DISTINCT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
    FROM users u
    WHERE (
        -- Incluir admins de la misma organización
        (u.organization_id = org_id AND u.role = 'admin' AND u.status = 'active')
        OR
        -- Incluir todos los superadmins activos
        (u.role = 'superadmin' AND u.status = 'active')
    )
    ORDER BY 
        CASE WHEN u.role = 'superadmin' THEN 1 ELSE 2 END,
        u.first_name,
        u.last_name;
END;
$$;

-- Asegurar permisos para la función
REVOKE ALL ON FUNCTION get_org_admins(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_org_admins(UUID) TO authenticated; 