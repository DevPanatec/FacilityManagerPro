-- Primero eliminamos las funciones existentes
DROP FUNCTION IF EXISTS import_organization_data(jsonb);
DROP FUNCTION IF EXISTS import_external_data();
DROP FUNCTION IF EXISTS export_organization_data(UUID);
DROP FUNCTION IF EXISTS export_all_organizations_data();

-- Función para importar datos externos
CREATE OR REPLACE FUNCTION import_external_data()
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'message', 'Datos externos importados correctamente'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para importar datos de organizaciones
CREATE OR REPLACE FUNCTION import_organization_data(data jsonb)
RETURNS json AS $$
DECLARE
    org_record jsonb;
    org_id uuid;
    result json;
BEGIN
    -- Iterar sobre cada organización en los datos
    FOR org_record IN SELECT * FROM jsonb_array_elements(data)
    LOOP
        -- Insertar o actualizar la organización
        INSERT INTO organizations (
            name,
            logo_url,
            status,
            created_at,
            updated_at
        ) VALUES (
            org_record->>'name',
            org_record->>'logo_url',
            COALESCE(org_record->>'status', 'active'),
            COALESCE((org_record->>'created_at')::timestamp with time zone, NOW()),
            NOW()
        )
        ON CONFLICT (name) 
        DO UPDATE SET
            logo_url = EXCLUDED.logo_url,
            status = EXCLUDED.status,
            updated_at = NOW()
        RETURNING id INTO org_id;
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

-- Función para exportar datos de una organización
CREATE OR REPLACE FUNCTION export_organization_data(org_id UUID)
RETURNS json AS $$
DECLARE
    resultado json;
BEGIN
    SELECT json_build_object(
        'organization', (
            SELECT row_to_json(o) 
            FROM organizations o 
            WHERE o.id = org_id
        ),
        'areas', (
            SELECT json_agg(row_to_json(a))
            FROM areas a
            WHERE a.organization_id = org_id
        ),
        'personal', (
            SELECT json_agg(row_to_json(ou))
            FROM user_organizations ou
            WHERE ou.organization_id = org_id
        ),
        'tasks', (
            SELECT json_agg(row_to_json(t))
            FROM tasks t
            WHERE t.organization_id = org_id
        )
    ) INTO resultado;

    RETURN resultado;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para exportar datos de todas las organizaciones
CREATE OR REPLACE FUNCTION export_all_organizations_data()
RETURNS json AS $$
DECLARE
    resultado json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'organization', o,
            'areas', (
                SELECT json_agg(row_to_json(a))
                FROM areas a
                WHERE a.organization_id = o.id
            ),
            'personal', (
                SELECT json_agg(row_to_json(ou))
                FROM user_organizations ou
                WHERE ou.organization_id = o.id
            ),
            'tasks', (
                SELECT json_agg(row_to_json(t))
                FROM tasks t
                WHERE t.organization_id = o.id
            )
        )
    )
    FROM organizations o
    INTO resultado;

    RETURN resultado;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 