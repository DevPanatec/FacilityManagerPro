-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Rooms are viewable by organization members" ON rooms
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM users 
            WHERE organization_id = rooms.organization_id
        )
    );

CREATE POLICY "Rooms can be managed by admins" ON rooms
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM users 
            WHERE organization_id = rooms.organization_id
            AND role = 'admin'
        )
    );

-- Insert initial rooms
INSERT INTO rooms (organization_id, name)
SELECT 
    id as organization_id,
    unnest(ARRAY[
        'MEDICINA DE VARONES',
        'MEDICINA DE MUJERES',
        'CIRUGÍA',
        'ESPECIALIDADES',
        'PEDIATRÍA',
        'GINECO OBSTETRICIA',
        'PUERPERIO',
        'SALÓN DE OPERACIONES',
        'PARTO',
        'UCI',
        'RADIOLOGÍA',
        'LABORATORIO',
        'URGENCIAS'
    ]) as name
FROM organizations; 