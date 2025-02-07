-- Crear tabla de salas
CREATE TABLE IF NOT EXISTS salas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_salas_organization ON salas(organization_id);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_salas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_salas_updated_at
    BEFORE UPDATE ON salas
    FOR EACH ROW
    EXECUTE FUNCTION update_salas_updated_at();

-- Habilitar RLS
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Salas son visibles para usuarios de la organización"
    ON salas FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Salas pueden ser modificadas por usuarios de la organización"
    ON salas FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Dar permisos
GRANT ALL ON salas TO authenticated;

-- Agregar columna sala_id a areas
ALTER TABLE areas ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES salas(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_areas_sala ON areas(sala_id);

-- Migrar MEDICINA DE VARONES de área a sala
DO $$ 
DECLARE
    v_area_id UUID;
    v_sala_id UUID;
BEGIN
    -- Verificar si MEDICINA DE VARONES ya existe como sala
    IF NOT EXISTS (
        SELECT 1 FROM salas 
        WHERE nombre = 'MEDICINA DE VARONES'
    ) THEN
        -- Obtener el área actual
        SELECT id INTO v_area_id
        FROM areas 
        WHERE name = 'MEDICINA DE VARONES'
        AND parent_id IS NULL;

        IF FOUND THEN
            -- Crear la nueva sala
            INSERT INTO salas (nombre, descripcion, organization_id)
            SELECT name, description, organization_id
            FROM areas
            WHERE id = v_area_id
            RETURNING id INTO v_sala_id;

            -- Actualizar las áreas hijas
            UPDATE areas
            SET sala_id = v_sala_id
            WHERE parent_id = v_area_id;

            -- Eliminar el área original
            DELETE FROM areas
            WHERE id = v_area_id;

            RAISE NOTICE 'MEDICINA DE VARONES convertida exitosamente de área a sala';
        ELSE
            RAISE NOTICE 'No se encontró el área MEDICINA DE VARONES';
        END IF;
    ELSE
        RAISE NOTICE 'MEDICINA DE VARONES ya existe como sala';
    END IF;
END $$;

-- Actualizar políticas de áreas para incluir sala_id
DROP POLICY IF EXISTS "Areas son visibles para usuarios de la organización" ON areas;
CREATE POLICY "Areas son visibles para usuarios de la organización"
    ON areas FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR
        sala_id IN (
            SELECT id FROM salas WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Areas pueden ser modificadas por usuarios de la organización" ON areas;
CREATE POLICY "Areas pueden ser modificadas por usuarios de la organización"
    ON areas FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR
        sala_id IN (
            SELECT id FROM salas WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR
        sala_id IN (
            SELECT id FROM salas WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 