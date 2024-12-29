-- Función para obtener el resumen de todas las empresas
CREATE OR REPLACE FUNCTION get_empresas_resumen()
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
    SELECT * FROM empresa_resumen
    ORDER BY nombre ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener detalles de una empresa específica
CREATE OR REPLACE FUNCTION get_empresa_detalle(empresa_id UUID)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'empresa', (SELECT row_to_json(e) FROM empresas e WHERE e.id = empresa_id),
        'personal', (SELECT json_agg(row_to_json(p)) FROM personal p WHERE p.empresa_id = empresa_id),
        'areas', (SELECT json_agg(row_to_json(a)) FROM areas a WHERE a.empresa_id = empresa_id),
        'actividades', (SELECT json_agg(row_to_json(ac)) FROM actividades ac WHERE ac.empresa_id = empresa_id)
    ) INTO resultado;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 