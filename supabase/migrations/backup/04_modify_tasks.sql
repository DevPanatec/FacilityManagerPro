-- Cuarta migración: Modificar la tabla tasks
BEGIN;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tipo VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP WITH TIME ZONE;

-- No necesitamos añadir organization_id porque ya existe

COMMIT; 