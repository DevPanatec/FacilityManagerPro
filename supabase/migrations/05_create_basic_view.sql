-- Crear una vista simple solo con datos de organizations
CREATE MATERIALIZED VIEW IF NOT EXISTS datahub_summary AS
SELECT 
    id,
    name as nombre,
    logo_url,
    0 as total_empleados,
    0 as total_areas,
    0 as total_actividades,
    0 as ingresos
FROM organizations;

-- Crear índice básico
CREATE INDEX IF NOT EXISTS idx_datahub_summary_id ON datahub_summary(id); 