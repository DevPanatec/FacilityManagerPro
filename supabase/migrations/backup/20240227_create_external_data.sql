-- Tabla para almacenar datos de fuentes externas
CREATE TABLE external_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name TEXT NOT NULL,
    data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida por nombre de fuente
CREATE INDEX idx_external_data_source_name ON external_data_sources(source_name);

-- Política de seguridad
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view external data"
    ON external_data_sources FOR SELECT
    TO authenticated
    USING (true); 