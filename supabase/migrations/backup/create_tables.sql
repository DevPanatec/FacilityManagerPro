-- Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de empresas
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'Activo',
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de áreas
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de personal
CREATE TABLE personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(255),
    email VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de actividades
CREATE TABLE actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_updated_at
    BEFORE UPDATE ON personal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actividades_updated_at
    BEFORE UPDATE ON actividades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Empresas visibles para usuarios autenticados"
    ON empresas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo administradores pueden modificar empresas"
    ON empresas FOR ALL
    TO authenticated
    USING (auth.uid() IN (
        SELECT user_id FROM user_roles WHERE role = 'admin'
    ));

-- Vista para resumen de empresas
CREATE VIEW empresa_resumen AS
SELECT 
    e.id,
    e.nombre,
    e.logo_url,
    e.estado,
    e.ultima_actualizacion,
    COUNT(DISTINCT p.id) as total_personal,
    COUNT(DISTINCT a.id) as total_areas,
    COUNT(DISTINCT ac.id) as total_actividades
FROM empresas e
LEFT JOIN personal p ON e.id = p.empresa_id
LEFT JOIN areas a ON e.id = a.empresa_id
LEFT JOIN actividades ac ON e.id = ac.empresa_id
GROUP BY e.id, e.nombre, e.logo_url, e.estado, e.ultima_actualizacion; 