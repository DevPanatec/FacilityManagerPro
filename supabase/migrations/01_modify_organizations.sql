-- Primera migración: Modificar la tabla organizations
BEGIN;

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

COMMIT; 