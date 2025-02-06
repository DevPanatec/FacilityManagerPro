-- Añadir columnas de tiempo a la tabla tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Crear índices para mejorar el rendimiento de las consultas por tiempo
CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_tasks_end_time ON tasks(end_time);

-- Añadir constraint para validar que end_time sea posterior a start_time
ALTER TABLE tasks
ADD CONSTRAINT tasks_time_check 
CHECK (end_time > start_time);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN tasks.start_time IS 'Hora de inicio de la tarea';
COMMENT ON COLUMN tasks.end_time IS 'Hora de finalización de la tarea';

-- Primero eliminamos la función existente
DROP FUNCTION IF EXISTS generate_search_vector(text, text, text);

-- Luego creamos la nueva versión
CREATE OR REPLACE FUNCTION generate_search_vector(title text, description text, additional_text text)
RETURNS tsvector AS $$
BEGIN
    RETURN setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
           setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
           setweight(to_tsvector('spanish', coalesce(additional_text, '')), 'C');
END;
$$ LANGUAGE plpgsql IMMUTABLE; 