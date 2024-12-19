-- Remove RLS policies
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Organizations are editable by organization members" ON organizations;

-- Drop functions
DROP FUNCTION IF EXISTS import_organization_data(JSONB);

-- Drop views
DROP VIEW IF EXISTS organization_resumen;

-- Remove added columns
ALTER TABLE tasks 
DROP COLUMN IF EXISTS tipo,
DROP COLUMN IF EXISTS fecha_inicio,
DROP COLUMN IF EXISTS fecha_fin;

ALTER TABLE staff_shifts 
DROP COLUMN IF EXISTS cargo,
DROP COLUMN IF EXISTS estado;

ALTER TABLE areas 
DROP COLUMN IF EXISTS descripcion;

ALTER TABLE organizations 
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS estado,
DROP COLUMN IF EXISTS ultima_actualizacion; 