BEGIN;

-- 1. Deshabilitar RLS temporalmente para hacer los cambios
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- 2. Crear política para organizations (reemplazar si existe)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organizations;
CREATE POLICY "Enable read access for authenticated users"
ON organizations FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM user_organizations 
    WHERE organization_id = id
  )
);

-- 3. Crear política para external_data_sources (reemplazar si existe)
DROP POLICY IF EXISTS "Enable read access for external data" ON external_data_sources;
CREATE POLICY "Enable read access for external data"
ON external_data_sources FOR SELECT
TO authenticated
USING (true); -- Permitir acceso a todos los usuarios autenticados

-- 4. Crear política para user_organizations (reemplazar si existe)
DROP POLICY IF EXISTS "Enable read access for user organizations" ON user_organizations;
CREATE POLICY "Enable read access for user organizations"
ON user_organizations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. Habilitar RLS nuevamente
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

COMMIT; 