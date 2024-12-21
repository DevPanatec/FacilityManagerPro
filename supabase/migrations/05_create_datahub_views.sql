-- Primero, asegurarnos de que no exista la vista
DROP MATERIALIZED VIEW IF EXISTS datahub_summary;

-- Crear la vista materializada
CREATE MATERIALIZED VIEW datahub_summary AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    (
        SELECT COUNT(DISTINCT ou.user_id)
        FROM user_organizations ou 
        WHERE ou.organization_id = o.id
        AND ou.status = 'active'
    ) as total_empleados,
    (
        SELECT COUNT(*)
        FROM areas a 
        WHERE a.organization_id = o.id
        AND a.status = 'active'
    ) as total_areas,
    (
        SELECT COUNT(*)
        FROM tasks t 
        WHERE t.organization_id = o.id
        AND t.status = 'completed'
    ) as total_actividades,
    COALESCE(
        (
            SELECT SUM(s.price)
            FROM services s 
            WHERE s.organization_id = o.id
            AND s.status = 'active'
        ), 0
    ) as ingresos
FROM organizations o
WHERE o.status = 'active';

-- Crear índice para mejorar el rendimiento
CREATE UNIQUE INDEX idx_datahub_summary_id ON datahub_summary(id);

-- Función para refrescar la vista
CREATE OR REPLACE FUNCTION refresh_datahub_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY datahub_summary;
END;
$$ LANGUAGE plpgsql;

-- Función para refrescar manualmente
CREATE OR REPLACE FUNCTION manually_refresh_datahub_summary()
RETURNS json AS $$
BEGIN
    PERFORM refresh_datahub_summary();
    RETURN json_build_object(
        'success', true,
        'message', 'Vista actualizada correctamente',
        'timestamp', NOW()
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar la vista cuando hay cambios en organizations
CREATE OR REPLACE FUNCTION trigger_refresh_datahub_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_datahub_summary();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a las tablas relevantes
DROP TRIGGER IF EXISTS refresh_datahub_on_org_change ON organizations;
CREATE TRIGGER refresh_datahub_on_org_change
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_datahub_summary();

DROP TRIGGER IF EXISTS refresh_datahub_on_user_change ON user_organizations;
CREATE TRIGGER refresh_datahub_on_user_change
    AFTER INSERT OR UPDATE OR DELETE ON user_organizations
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_datahub_summary();

DROP TRIGGER IF EXISTS refresh_datahub_on_area_change ON areas;
CREATE TRIGGER refresh_datahub_on_area_change
    AFTER INSERT OR UPDATE OR DELETE ON areas
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_datahub_summary();

DROP TRIGGER IF EXISTS refresh_datahub_on_task_change ON tasks;
CREATE TRIGGER refresh_datahub_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_datahub_summary();

DROP TRIGGER IF EXISTS refresh_datahub_on_service_change ON services;
CREATE TRIGGER refresh_datahub_on_service_change
    AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_datahub_summary();

-- Hacer el refresh inicial
SELECT refresh_datahub_summary(); 