-- 1. Modificar la tabla organizations para incluir los campos necesarios
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Crear vista de resumen usando las tablas existentes
CREATE OR REPLACE VIEW organization_resumen AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    o.estado,
    o.ultima_actualizacion,
    COUNT(DISTINCT a.id) as total_areas,
    COUNT(DISTINCT ou.id) as total_personal,
    COUNT(DISTINCT oa.id) as total_actividades
FROM organizations o
LEFT JOIN areas a ON o.id = a.org_id
LEFT JOIN organization_users ou ON o.id = ou.org_id
LEFT JOIN organization_activity oa ON o.id = oa.org_id
GROUP BY o.id, o.name, o.logo_url, o.estado, o.ultima_actualizacion;

-- 3. Crear funciones para la API
CREATE OR REPLACE FUNCTION get_organization_summary(org_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'organization', row_to_json(o.*),
        'areas', COALESCE((
            SELECT json_agg(row_to_json(a.*))
            FROM areas a
            WHERE a.org_id = org_id
        ), '[]'::json),
        'users', COALESCE((
            SELECT json_agg(row_to_json(ou.*))
            FROM organization_users ou
            WHERE ou.org_id = org_id
        ), '[]'::json),
        'activity', COALESCE((
            SELECT json_agg(row_to_json(oa.*))
            FROM organization_activity oa
            WHERE oa.org_id = org_id
        ), '[]'::json),
        'settings', COALESCE((
            SELECT row_to_json(os.*)
            FROM organization_settings os
            WHERE os.org_id = org_id
        ), '{}'::json)
    )
    INTO result
    FROM organizations o
    WHERE o.id = org_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para exportar datos
CREATE OR REPLACE FUNCTION export_organization_data(org_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'organization', row_to_json(o.*),
        'areas', COALESCE((
            SELECT json_agg(row_to_json(a.*))
            FROM areas a
            WHERE a.org_id = org_id
        ), '[]'::json),
        'users', COALESCE((
            SELECT json_agg(row_to_json(ou.*))
            FROM organization_users ou
            WHERE ou.org_id = org_id
        ), '[]'::json),
        'documents', COALESCE((
            SELECT json_agg(row_to_json(d.*))
            FROM documents d
            WHERE d.org_id = org_id
        ), '[]'::json),
        'settings', COALESCE((
            SELECT row_to_json(os.*)
            FROM organization_settings os
            WHERE os.org_id = org_id
        ), '{}'::json)
    )
    INTO result
    FROM organizations o
    WHERE o.id = org_id;
    
    -- Registrar la actividad de exportación
    INSERT INTO organization_activity (org_id, activity_type, description)
    VALUES (org_id, 'export', 'Exported organization data');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Eliminar políticas existentes si existen
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view organization data" ON organizations;
    DROP POLICY IF EXISTS "Users can view organization activity" ON organizations;
EXCEPTION 
    WHEN undefined_object THEN 
        NULL;
END $$;

-- 6. Crear nuevas políticas
CREATE POLICY "Users can view organization data"
ON organizations FOR SELECT
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM organization_users 
        WHERE org_id = id
    )
);

CREATE POLICY "Users can view organization activity"
ON organization_activity FOR SELECT
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM organization_users 
        WHERE org_id = organization_activity.org_id
    )
); 