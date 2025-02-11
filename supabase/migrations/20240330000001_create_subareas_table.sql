-- Create subareas table
CREATE TABLE IF NOT EXISTS subareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subareas_area_id ON subareas(area_id);

-- Create trigger for updated_at
CREATE TRIGGER update_subareas_updated_at
    BEFORE UPDATE ON subareas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE subareas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Subareas son visibles para usuarios de la organización"
    ON subareas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM areas a
            JOIN organizations o ON o.id = a.organization_id
            JOIN users u ON u.organization_id = o.id
            WHERE a.id = subareas.area_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Subareas pueden ser modificadas por usuarios de la organización"
    ON subareas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM areas a
            JOIN organizations o ON o.id = a.organization_id
            JOIN users u ON u.organization_id = o.id
            WHERE a.id = subareas.area_id
            AND u.id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM areas a
            JOIN organizations o ON o.id = a.organization_id
            JOIN users u ON u.organization_id = o.id
            WHERE a.id = subareas.area_id
            AND u.id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON subareas TO authenticated; 