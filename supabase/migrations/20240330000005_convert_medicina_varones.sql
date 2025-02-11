-- Migrar MEDICINA DE VARONES de área a sala
DO $$ 
DECLARE
    v_area_id UUID;
    v_sala_id UUID;
    v_org_id UUID;
BEGIN
    -- Verificar si MEDICINA DE VARONES ya existe como sala
    IF NOT EXISTS (
        SELECT 1 FROM salas 
        WHERE nombre = 'MEDICINA DE VARONES'
    ) THEN
        -- Obtener el área actual
        SELECT id, organization_id INTO v_area_id, v_org_id
        FROM areas 
        WHERE name = 'MEDICINA DE VARONES'
        AND parent_id IS NULL;

        IF FOUND THEN
            -- Crear la nueva sala
            INSERT INTO salas (nombre, descripcion, organization_id)
            SELECT name, description, organization_id
            FROM areas
            WHERE id = v_area_id
            RETURNING id INTO v_sala_id;

            -- Actualizar las áreas hijas
            UPDATE areas
            SET sala_id = v_sala_id
            WHERE parent_id = v_area_id;

            -- Eliminar el área original
            DELETE FROM areas
            WHERE id = v_area_id;

            RAISE NOTICE 'MEDICINA DE VARONES convertida exitosamente de área a sala';
        ELSE
            RAISE NOTICE 'No se encontró el área MEDICINA DE VARONES';
        END IF;
    ELSE
        RAISE NOTICE 'MEDICINA DE VARONES ya existe como sala';
    END IF;
END $$; 