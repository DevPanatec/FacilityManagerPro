-- Paso 1: Eliminar políticas existentes para organizations
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;

-- Paso 2: Habilitar RLS solo para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Paso 3: Crear políticas básicas para organizations
CREATE POLICY "organizations_insert_policy" ON organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT
    TO authenticated
    USING (true);

-- Paso 4: Dar permisos básicos
GRANT ALL ON organizations TO authenticated;