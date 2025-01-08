-- Tercera migración: Modificar la tabla staff_shifts
BEGIN;

ALTER TABLE staff_shifts
ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo';

-- No necesitamos añadir area_id y organization_id porque ya existen

COMMIT; 