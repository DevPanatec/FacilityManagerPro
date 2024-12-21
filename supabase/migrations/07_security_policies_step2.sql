-- Paso 1: Deshabilitar temporalmente RLS
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Paso 2: Crear una política más simple para user_organizations
CREATE POLICY "user_organizations_bypass_rls" ON user_organizations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Paso 3: Dar permisos explícitos
GRANT ALL ON user_organizations TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON areas TO authenticated;
GRANT ALL ON tasks TO authenticated;

-- Paso 4: Dar permisos a la función de importación
ALTER FUNCTION import_excel_data(jsonb) SECURITY DEFINER;

-- Paso 5: Dar permisos para las secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 