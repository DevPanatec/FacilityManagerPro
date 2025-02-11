-- Script para modificar la restricción única de la tabla salas
-- Este script debe ser ejecutado por el administrador de la base de datos

-- Comenzar una transacción para asegurar la integridad de los cambios
BEGIN;

-- Verificar si la restricción existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'salas_nombre_key'
        AND table_name = 'salas'
    ) THEN
        -- Eliminar la restricción única existente en el nombre
        ALTER TABLE salas DROP CONSTRAINT salas_nombre_key;
        RAISE NOTICE 'Restricción salas_nombre_key eliminada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción salas_nombre_key no existe';
    END IF;
END $$;

-- Crear la nueva restricción que permite nombres duplicados en diferentes organizaciones
ALTER TABLE salas 
ADD CONSTRAINT salas_nombre_org_unique 
UNIQUE (nombre, organization_id);

RAISE NOTICE 'Nueva restricción salas_nombre_org_unique creada exitosamente';

-- Verificar que la nueva restricción se haya creado correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'salas_nombre_org_unique'
        AND table_name = 'salas'
    ) THEN
        RAISE NOTICE 'Verificación exitosa: La nueva restricción está activa';
    ELSE
        RAISE EXCEPTION 'Error: La nueva restricción no se creó correctamente';
    END IF;
END $$;

-- Confirmar la transacción si todo está correcto
COMMIT; 