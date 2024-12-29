-- Segunda migración: Modificar la tabla areas
BEGIN;

ALTER TABLE areas
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- No necesitamos añadir organization_id porque ya existe en la tabla

COMMIT; 