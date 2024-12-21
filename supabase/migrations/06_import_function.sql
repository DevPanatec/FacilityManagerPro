-- Función para importar datos con el formato correcto
CREATE OR REPLACE FUNCTION import_excel_data(data jsonb)
RETURNS json AS $$
DECLARE
    item jsonb;
    org_id uuid;
    result json;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        -- Insertar organización
        INSERT INTO organizations (
            name,
            logo_url,
            status,
            type
        ) VALUES (
            item->>'nombre',
            item->>'logo_url',
            'active',
            COALESCE(item->>'type', 'empresa')
        ) RETURNING id INTO org_id;

        -- Insertar personal
        INSERT INTO user_organizations (
            organization_id,
            user_id,
            status
        ) 
        SELECT 
            org_id,
            gen_random_uuid(),
            'active'
        FROM generate_series(1, (item->>'personal')::int);

        -- Insertar áreas
        INSERT INTO areas (
            organization_id,
            name,
            status
        )
        SELECT 
            org_id,
            'Área ' || generate_series,
            'active'
        FROM generate_series(1, (item->>'areas')::int);

        -- Insertar tareas/servicios
        INSERT INTO tasks (
            organization_id,
            name,
            status
        )
        SELECT 
            org_id,
            'Servicio ' || generate_series,
            'completed'
        FROM generate_series(1, (item->>'servicios')::int);
    END LOOP;

    result := json_build_object(
        'success', true,
        'message', 'Datos importados correctamente'
    );
    
    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 