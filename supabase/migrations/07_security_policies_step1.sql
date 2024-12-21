-- Paso 1: Habilitar RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Paso 2: Crear políticas básicas para organizations
CREATE POLICY "organizations_policy_insert" ON organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "organizations_policy_select" ON organizations
    FOR SELECT
    TO authenticated
    USING (true);

-- Paso 3: Dar permisos básicos
GRANT ALL ON organizations TO authenticated; 