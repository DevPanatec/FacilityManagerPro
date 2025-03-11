-- Create salas table
CREATE TABLE IF NOT EXISTS salas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_salas_organization ON salas(organization_id);

-- Enable Row Level Security
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Create policy for access control
CREATE POLICY "salas_policy"
ON salas FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
    )
);

-- Insert initial salas for the organization
INSERT INTO salas (organization_id, name, type, description) 
VALUES 
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'ADMINISTRACIÓN', 'admin', 'Área administrativa del hospital'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'GASTRO', 'medical', 'Área de gastroenterología'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'SALA DE MEDICINA', 'medical', 'Sala general de medicina'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'SALA DE ONCOLOGÍA', 'medical', 'Área de oncología'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'SALA UROLOGÍA', 'medical', 'Área de urología'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'NEUMOLOGÍA', 'medical', 'Área de neumología'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'TRANSPORTE', 'support', 'Servicio de transporte'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'DOCENCIA', 'education', 'Área de docencia médica'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'RESIDENCIA', 'residence', 'Área de residentes'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'HOSPITAL DEL DÍA', 'daycare', 'Hospital del día'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'AREAS ESPECIALES', 'special', 'Áreas especiales'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'SALA DE VARONES PSIQUIATRÍA', 'psychiatric', 'Sala de psiquiatría para varones'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'SALA DE MUJERES PSIQUIATRÍA', 'psychiatric', 'Sala de psiquiatría para mujeres'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'INTENSIVO PSIQUIATRÍA', 'psychiatric', 'Unidad de cuidados intensivos psiquiátricos'),
    ('de9317b7-8740-4ccf-b6fb-facdf0023f87', 'FARMACIA', 'pharmacy', 'Farmacia del hospital'); 