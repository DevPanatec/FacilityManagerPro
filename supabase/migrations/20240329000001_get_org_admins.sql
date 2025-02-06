-- Actualizar la función para incluir superadmins y mejorar el filtrado para enterprise
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