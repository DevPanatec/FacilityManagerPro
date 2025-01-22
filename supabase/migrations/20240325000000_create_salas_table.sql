-- Create salas table
CREATE TABLE IF NOT EXISTS salas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add sala_id to areas table
ALTER TABLE areas 
ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES salas(id);

-- Create RLS policies for salas
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON salas
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow insert for authenticated admin users" ON salas
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

CREATE POLICY "Allow update for authenticated admin users" ON salas
    FOR UPDATE TO authenticated
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

CREATE POLICY "Allow delete for authenticated admin users" ON salas
    FOR DELETE TO authenticated
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    ); 