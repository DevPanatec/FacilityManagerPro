-- Create contingency_types table
CREATE TABLE IF NOT EXISTS contingency_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE contingency_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view contingency types from their organization"
    ON contingency_types
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can manage contingency types"
    ON contingency_types
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND organization_id = contingency_types.organization_id
            AND role = 'admin'
        )
    );

-- Insert default contingency types for each organization
INSERT INTO contingency_types (organization_id, name, description)
SELECT 
    o.id as organization_id,
    t.name,
    t.description
FROM organizations o
CROSS JOIN (
    VALUES 
        ('Tubería rota', 'Problemas relacionados con tuberías dañadas o con fugas'),
        ('Falla eléctrica', 'Problemas con el sistema eléctrico o cortes de energía'),
        ('Incendio', 'Situaciones de incendio o riesgo de incendio'),
        ('Inundación', 'Problemas de inundación o daños por agua'),
        ('Fuga de gas', 'Detección de fugas de gas o problemas relacionados'),
        ('Accidente laboral', 'Accidentes que involucran al personal'),
        ('Falla de equipos', 'Problemas con maquinaria o equipos'),
        ('Mantenimiento preventivo', 'Tareas de mantenimiento programado'),
        ('Seguridad', 'Incidentes relacionados con la seguridad'),
        ('Otro', 'Otros tipos de contingencias no categorizadas')
) t(name, description)
ON CONFLICT (organization_id, name) DO NOTHING;

-- Create indexes
CREATE INDEX idx_contingency_types_organization_id ON contingency_types(organization_id);
CREATE INDEX idx_contingency_types_is_active ON contingency_types(is_active); 