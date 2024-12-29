-- Función para exportar datos
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
        ), '[]'::json)
    )
    INTO result
    FROM organizations o
    WHERE o.id = org_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 