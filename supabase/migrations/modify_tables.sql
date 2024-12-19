-- Modificar la tabla organizations para manejar las empresas
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Usar la tabla areas existente
ALTER TABLE areas
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Modificar la tabla staff_shifts para manejar el personal
ALTER TABLE staff_shifts
ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo';

-- Usar la tabla tasks para las actividades
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tipo VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP WITH TIME ZONE;

-- Vista para resumen de organizaciones
CREATE OR REPLACE VIEW organization_resumen AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    o.estado,
    o.ultima_actualizacion,
    COUNT(DISTINCT ss.id) as total_personal,
    COUNT(DISTINCT a.id) as total_areas,
    COUNT(DISTINCT t.id) as total_actividades
FROM organizations o
LEFT JOIN staff_shifts ss ON o.id = ss.organization_id
LEFT JOIN areas a ON o.id = a.organization_id
LEFT JOIN tasks t ON o.id = t.organization_id
GROUP BY o.id, o.name, o.logo_url, o.estado, o.ultima_actualizacion;

-- Función para obtener el resumen de todas las organizaciones
CREATE OR REPLACE FUNCTION get_organizations_resumen()
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    logo_url VARCHAR,
    estado VARCHAR,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE,
    total_personal BIGINT,
    total_areas BIGINT,
    total_actividades BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM organization_resumen
    ORDER BY nombre ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener detalles de una organización específica
CREATE OR REPLACE FUNCTION get_organization_detalle(org_id UUID)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'organization', (SELECT row_to_json(o) FROM organizations o WHERE o.id = org_id),
        'personal', (SELECT json_agg(row_to_json(ss)) FROM staff_shifts ss WHERE ss.organization_id = org_id),
        'areas', (SELECT json_agg(row_to_json(a)) FROM areas a WHERE a.organization_id = org_id),
        'tasks', (SELECT json_agg(row_to_json(t)) FROM tasks t WHERE t.organization_id = org_id)
    ) INTO resultado;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 