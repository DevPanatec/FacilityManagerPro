-- Función para importar datos desde JSON
CREATE OR REPLACE FUNCTION import_organization_data(data JSONB)
RETURNS JSON AS $$
DECLARE
    org_id UUID;
    area_data JSONB;
    staff_data JSONB;
    task_data JSONB;
    resultado JSON;
BEGIN
    -- Insertar organización
    INSERT INTO organizations (
        name,
        logo_url,
        estado,
        ultima_actualizacion
    )
    SELECT 
        data->>'nombre',
        data->>'logo_url',
        COALESCE(data->>'estado', 'Activo'),
        COALESCE((data->>'ultima_actualizacion')::TIMESTAMP WITH TIME ZONE, CURRENT_TIMESTAMP)
    RETURNING id INTO org_id;

    -- Insertar áreas
    FOR area_data IN SELECT * FROM jsonb_array_elements(data->'areas')
    LOOP
        INSERT INTO areas (
            organization_id,
            name,
            descripcion
        ) VALUES (
            org_id,
            area_data->>'nombre',
            area_data->>'descripcion'
        );
    END LOOP;

    -- Insertar personal (staff_shifts)
    FOR staff_data IN SELECT * FROM jsonb_array_elements(data->'personal')
    LOOP
        INSERT INTO staff_shifts (
            organization_id,
            area_id,
            cargo,
            estado
        ) VALUES (
            org_id,
            (staff_data->>'area_id')::UUID,
            staff_data->>'cargo',
            COALESCE(staff_data->>'estado', 'Activo')
        );
    END LOOP;

    -- Insertar tareas
    FOR task_data IN SELECT * FROM jsonb_array_elements(data->'tasks')
    LOOP
        INSERT INTO tasks (
            organization_id,
            tipo,
            fecha_inicio,
            fecha_fin
        ) VALUES (
            org_id,
            task_data->>'tipo',
            (task_data->>'fecha_inicio')::TIMESTAMP WITH TIME ZONE,
            (task_data->>'fecha_fin')::TIMESTAMP WITH TIME ZONE
        );
    END LOOP;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'organization_id', org_id,
        'message', 'Datos importados correctamente'
    ) INTO resultado;

    RETURN resultado;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para exportar datos de una organización
CREATE OR REPLACE FUNCTION export_organization_data(org_id UUID)
RETURNS JSON AS $$
DECLARE
    resultado JSON;
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
            SELECT json_agg(row_to_json(ss))
            FROM staff_shifts ss
            WHERE ss.organization_id = org_id
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
RETURNS JSON AS $$
DECLARE
    resultado JSON;
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
                SELECT json_agg(row_to_json(ss))
                FROM staff_shifts ss
                WHERE ss.organization_id = o.id
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