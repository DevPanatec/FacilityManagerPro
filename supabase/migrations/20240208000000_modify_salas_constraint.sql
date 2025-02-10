-- Eliminar la restricción única existente en el nombre
ALTER TABLE salas DROP CONSTRAINT IF EXISTS salas_nombre_key;

-- Crear una nueva restricción única que combine nombre y organization_id
ALTER TABLE salas ADD CONSTRAINT salas_nombre_org_unique UNIQUE (nombre, organization_id); 