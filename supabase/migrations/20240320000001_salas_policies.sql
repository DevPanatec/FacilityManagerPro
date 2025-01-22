-- Enable RLS
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir insertar salas
CREATE POLICY "Permitir insertar salas" ON salas
    FOR INSERT
    WITH CHECK (true);

-- Crear política para permitir ver salas
CREATE POLICY "Permitir ver salas" ON salas
    FOR SELECT
    USING (true); 