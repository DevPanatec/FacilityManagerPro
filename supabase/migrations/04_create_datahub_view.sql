-- Crear una vista materializada segura que solo LEE datos existentes
CREATE MATERIALIZED VIEW IF NOT EXISTS datahub_summary AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    (
        SELECT COUNT(DISTINCT ou.user_id)
        FROM user_organizations ou 
        WHERE ou.organization_id = o.id
    ) as total_empleados,
    (
        SELECT COUNT(*)
        FROM areas a 
        WHERE a.organization_id = o.id
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
        ), 0
    ) as ingresos
FROM organizations o;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_datahub_summary_org_id ON datahub_summary(id);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_datahub_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY datahub_summary;
EXCEPTION WHEN OTHERS THEN
    -- Log error y continuar
    RAISE NOTICE 'Error refreshing view: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Crear una función RPC para refrescar manualmente
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
        'message', SQLERRM,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear un job para refrescar la vista cada hora (opcional)
-- Comenta esta parte si no tienes la extensión pg_cron instalada
/*
SELECT cron.schedule(
    'refresh-datahub-summary',
    '0 * * * *',  -- cada hora
    $$
    SELECT refresh_datahub_summary();
    $$
);
*/