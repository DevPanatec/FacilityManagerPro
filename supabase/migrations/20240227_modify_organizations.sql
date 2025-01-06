-- Solo añadir las columnas necesarias a organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Crear una vista simple para el resumen
CREATE OR REPLACE VIEW organization_resumen AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    o.estado,
    o.ultima_actualizacion,
    COUNT(DISTINCT a.id) as total_areas
FROM organizations o
LEFT JOIN areas a ON o.id = a.organization_id
GROUP BY o.id, o.name, o.logo_url, o.estado, o.ultima_actualizacion; 