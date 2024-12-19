-- Quinta migración: Crear vista de resumen
BEGIN;

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

COMMIT; 