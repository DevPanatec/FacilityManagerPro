-- Primero eliminamos las restricciones existentes
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_organization_id_fkey;
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_organization_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_organization_id_fkey;
ALTER TABLE revenue DROP CONSTRAINT IF EXISTS revenue_organization_id_fkey;

-- Modificar la tabla organizations
ALTER TABLE organizations
  ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ADD CONSTRAINT organizations_nombre_unique UNIQUE (nombre);

-- Modificar la tabla staff
ALTER TABLE staff
  ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN organization_id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ADD CONSTRAINT staff_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

-- Modificar la tabla areas
ALTER TABLE areas
  ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN organization_id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ADD CONSTRAINT areas_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

-- Modificar la tabla activities
ALTER TABLE activities
  ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN organization_id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ADD CONSTRAINT activities_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

-- Modificar la tabla revenue
ALTER TABLE revenue
  ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN organization_id SET DATA TYPE UUID USING (uuid_generate_v4()),
  ADD CONSTRAINT revenue_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

-- Crear o reemplazar índices
DROP INDEX IF EXISTS idx_staff_organization;
DROP INDEX IF EXISTS idx_areas_organization;
DROP INDEX IF EXISTS idx_activities_organization;
DROP INDEX IF EXISTS idx_revenue_organization;

CREATE INDEX idx_staff_organization ON staff(organization_id);
CREATE INDEX idx_areas_organization ON areas(organization_id);
CREATE INDEX idx_activities_organization ON activities(organization_id);
CREATE INDEX idx_revenue_organization ON revenue(organization_id);

-- Crear o reemplazar el trigger de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
DROP TRIGGER IF EXISTS update_revenue_updated_at ON revenue;

-- Crear nuevos triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_revenue_updated_at
    BEFORE UPDATE ON revenue
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 