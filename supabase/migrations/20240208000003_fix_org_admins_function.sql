-- Drop existing function first
DROP FUNCTION IF EXISTS get_org_admins(UUID);

-- Recreate the function with updated logic and permissions
CREATE OR REPLACE FUNCTION get_org_admins(org_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role TEXT;
    v_user_org_id UUID;
BEGIN
    -- Obtener información del usuario actual
    SELECT u.role, u.organization_id 
    INTO v_user_role, v_user_org_id 
    FROM users u 
    WHERE u.id = auth.uid();
    
    -- Verificar permisos
    IF v_user_role NOT IN ('enterprise', 'admin', 'superadmin') THEN
        RAISE EXCEPTION 'No tienes permiso para ver los administradores';
    END IF;

    -- Para usuarios enterprise, verificar que pertenezcan a la organización
    IF v_user_role = 'enterprise' AND v_user_org_id != org_id THEN
        RAISE EXCEPTION 'No tienes permiso para ver administradores de otra organización';
    END IF;

    RETURN QUERY
    SELECT DISTINCT
        u.id as user_id,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) as full_name,
        u.email,
        u.role,
        u.avatar_url
    FROM users u
    WHERE (
        -- Incluir admins de la misma organización
        (u.organization_id = org_id AND u.role = 'admin' AND u.status = 'active')
        OR
        -- Incluir superadmins activos
        (u.role = 'superadmin' AND u.status = 'active')
    )
    AND u.id != auth.uid() -- Excluir al usuario actual
    ORDER BY 
        CASE WHEN u.role = 'superadmin' THEN 1 ELSE 2 END,
        full_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_org_admins(UUID) TO authenticated;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to authenticated users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
CREATE POLICY "Enable read access for authenticated users"
ON users
FOR SELECT
TO authenticated
USING (
    -- Users can see their own data
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
    )
); 