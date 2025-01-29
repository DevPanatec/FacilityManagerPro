-- Create salas table
CREATE TABLE IF NOT EXISTS public.salas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sala_id to areas table
ALTER TABLE areas 
ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES salas(id);

-- Enable RLS
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Salas are viewable by authenticated users"
    ON public.salas
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Salas can be created by admins"
    ON public.salas
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin')
        )
    );

CREATE POLICY "Salas can be updated by admins"
    ON public.salas
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin')
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_salas_updated_at
    BEFORE UPDATE ON salas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 