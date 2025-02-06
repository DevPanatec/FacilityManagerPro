-- Agregar campos faltantes a la tabla tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS sala_id uuid REFERENCES salas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS frequency text CHECK (frequency IN ('diario', 'semanal', 'quincenal', 'mensual')),
ADD COLUMN IF NOT EXISTS type text;

-- Crear índice para el nuevo campo
CREATE INDEX IF NOT EXISTS idx_tasks_sala_id ON tasks(sala_id);

-- Actualizar la función de búsqueda
CREATE OR REPLACE FUNCTION generate_search_vector(title text, description text, metadata text)
RETURNS tsvector AS $$
BEGIN
    RETURN setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
           setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
           setweight(to_tsvector('spanish', coalesce(metadata, '')), 'C');
END;
$$ LANGUAGE plpgsql IMMUTABLE; 