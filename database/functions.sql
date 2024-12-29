-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION check_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles p
        JOIN roles r ON p.organization_id = r.organization_id
        JOIN permissions perm ON r.id = perm.role_id
        WHERE p.user_id = p_user_id
        AND perm.resource = p_resource
        AND perm.action = p_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener las organizaciones de un usuario
CREATE OR REPLACE FUNCTION get_user_organizations(
    p_user_id UUID
) RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.organization_id
    FROM profiles p
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 