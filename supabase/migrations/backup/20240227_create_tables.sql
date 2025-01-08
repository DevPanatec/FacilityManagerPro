BEGIN;

-- Verificar y crear tabla de personal si no existe
CREATE TABLE IF NOT EXISTS personal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT,
  estado TEXT DEFAULT 'Activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_area
    FOREIGN KEY(area_id) 
    REFERENCES areas(id)
    ON DELETE CASCADE
);

-- Modificar la tabla de áreas si es necesario
ALTER TABLE areas 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';

-- Modificar la tabla de documentos si existe, si no, crearla
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    -- Modificar la tabla existente
    ALTER TABLE documents 
    ADD COLUMN IF NOT EXISTS nombre TEXT,
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS tipo_servicio TEXT,
    ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';
  ELSE
    -- Crear la tabla nueva
    CREATE TABLE documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      tipo_servicio TEXT NOT NULL,
      estado TEXT DEFAULT 'Activo',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Insertar datos de ejemplo solo si la tabla está vacía
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM documents LIMIT 1) THEN
    INSERT INTO documents (organization_id, nombre, tipo_servicio, descripcion)
    SELECT 
      org.id,
      'Servicio ' || generate_series(1, 5),
      CASE (random() * 3)::int
        WHEN 0 THEN 'Limpieza'
        WHEN 1 THEN 'Mantenimiento'
        ELSE 'Seguridad'
      END,
      'Descripción del servicio ' || generate_series(1, 5)
    FROM organizations org;
  END IF;
END $$;

COMMIT;