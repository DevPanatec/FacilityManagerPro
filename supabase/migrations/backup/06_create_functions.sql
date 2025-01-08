-- Sexta migración: Crear funciones con manejo de transacciones
BEGIN;

-- Función para importar datos
CREATE OR REPLACE FUNCTION import_organization_data(data JSONB)
RETURNS JSON AS $$
DECLARE
    org_id UUID;
    area_data JSONB;
    staff_data JSONB;
    task_data JSONB;
    resultado JSON;
BEGIN
    -- Iniciar transacción explícita
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

        -- Insertar personal
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

        -- Confirmar transacción
        COMMIT;

        SELECT json_build_object(
            'success', true,
            'organization_id', org_id,
            'message', 'Datos importados correctamente'
        ) INTO resultado;

        RETURN resultado;
    EXCEPTION WHEN OTHERS THEN
        -- Revertir transacción en caso de error
        ROLLBACK;
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Las otras funciones permanecen igual pero dentro de la transacción principal
COMMIT; 