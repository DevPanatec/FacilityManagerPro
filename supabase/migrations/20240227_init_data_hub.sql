-- 1. Primero, asegúrate de que las tablas base existan
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Luego, añade las columnas necesarias
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE areas
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 3. Crea la vista de resumen
CREATE OR REPLACE VIEW organization_resumen AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    o.estado,
    o.ultima_actualizacion,
    COUNT(DISTINCT a.id) as total_areas
FROM organizations o
LEFT JOIN areas a ON o.id = a.org_id
GROUP BY o.id, o.name, o.logo_url, o.estado, o.ultima_actualizacion;

-- 4. Crea las funciones básicas de la API
-- Función para obtener todas las organizaciones
CREATE OR REPLACE FUNCTION get_organizations()
RETURNS SETOF organization_resumen
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM organization_resumen ORDER BY nombre;
$$;

-- Función para obtener una organización específica
CREATE OR REPLACE FUNCTION get_organization(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'organization', row_to_json(o.*),
        'areas', COALESCE(
            (SELECT json_agg(row_to_json(a.*))
             FROM areas a
             WHERE a.org_id = org_id
            ), '[]'::json)
    )
    INTO result
    FROM organizations o
    WHERE o.id = org_id;
    
    RETURN result;
END;
$$;

-- 5. Configura las políticas de seguridad
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Política para ver organizaciones
CREATE POLICY "Organizations are viewable by authenticated users"
ON organizations FOR SELECT
TO authenticated
USING (true);

-- Política para editar organizaciones
CREATE POLICY "Organizations are editable by organization members"
ON organizations FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM user_organizations 
        WHERE org_id = id
    )
);

-- Políticas similares para áreas
CREATE POLICY "Areas are viewable by organization members"
ON areas FOR SELECT
TO authenticated
USING (
    org_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
    )
); 