-- Agregar columnas para el Data Hub a la tabla organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_empleados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_areas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_actividades INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(50) DEFAULT 'servicios',
ADD COLUMN IF NOT EXISTS ingresos DECIMAL(15,2) DEFAULT 0;

-- Crear una vista materializada para el Data Hub
CREATE MATERIALIZED VIEW IF NOT EXISTS datahub_summary AS
SELECT 
    o.id,
    o.nombre,
    o.logo_url,
    COUNT(DISTINCT ou.user_id) as total_empleados,
    COUNT(DISTINCT a.id) as total_areas,
    COUNT(DISTINCT t.id) as total_actividades,
    COALESCE(SUM(s.rate), 0) as ingresos
FROM organizations o
LEFT JOIN user_organizations ou ON o.id = ou.organization_id
LEFT JOIN areas a ON o.id = a.organization_id
LEFT JOIN tasks t ON o.id = t.organization_id
LEFT JOIN services s ON o.id = s.organization_id
GROUP BY o.id, o.nombre, o.logo_url;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_datahub_summary_org_id ON datahub_summary(id);

-- Crear función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_datahub_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY datahub_summary;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar la vista cuando hay cambios
CREATE OR REPLACE FUNCTION update_datahub_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_datahub_summary();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas relevantes
DROP TRIGGER IF EXISTS trigger_update_datahub_summary ON organizations;
CREATE TRIGGER trigger_update_datahub_summary
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_datahub_summary();

-- Repetir para otras tablas relevantes
DROP TRIGGER IF EXISTS trigger_update_datahub_summary_users ON user_organizations;
CREATE TRIGGER trigger_update_datahub_summary_users
    AFTER INSERT OR UPDATE OR DELETE ON user_organizations
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_datahub_summary();

-- Y así sucesivamente para areas, tasks, y services 