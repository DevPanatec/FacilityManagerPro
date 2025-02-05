-- Agregar restricción UNIQUE para evitar duplicados de turnos en la misma organización
ALTER TABLE work_shifts ADD CONSTRAINT work_shifts_org_name_unique UNIQUE (organization_id, name);

-- Función para insertar turnos predefinidos para una organización
CREATE OR REPLACE FUNCTION insert_default_shifts(org_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO work_shifts (organization_id, name, description, start_time, end_time)
    VALUES 
        (org_id, 'Turno A', 'Turno de mañana', '08:00:00', '16:00:00'),
        (org_id, 'Turno B', 'Turno de tarde', '16:00:00', '00:00:00'),
        (org_id, 'Turno C', 'Turno de noche', '00:00:00', '08:00:00')
    ON CONFLICT (organization_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Crear un índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_work_shifts_name ON work_shifts(name);

-- Trigger para insertar turnos predefinidos cuando se crea una nueva organización
CREATE OR REPLACE FUNCTION create_default_shifts_for_new_org()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM insert_default_shifts(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_default_shifts_trigger
AFTER INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION create_default_shifts_for_new_org();

-- Insertar los turnos para las organizaciones existentes
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        PERFORM insert_default_shifts(org_record.id);
    END LOOP;
END $$; 