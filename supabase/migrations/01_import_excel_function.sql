-- Función simple para importar datos desde Excel
CREATE OR REPLACE FUNCTION import_excel_data(data jsonb)
RETURNS json AS $$
DECLARE
    org_record jsonb;
    result json;
BEGIN
    -- Iterar sobre cada registro del Excel
    FOR org_record IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        -- Solo insertar, sin actualizar registros existentes
        INSERT INTO organizations (
            name,
            status,
            created_at,
            updated_at
        ) VALUES (
            org_record->>'name',
            'active',
            NOW(),
            NOW()
        );
    END LOOP;

    result := json_build_object(
        'success', true,
        'message', 'Datos de Excel importados correctamente'
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 