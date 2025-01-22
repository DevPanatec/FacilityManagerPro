-- Función para eliminar salas duplicadas
CREATE OR REPLACE FUNCTION eliminar_salas_duplicadas()
RETURNS void AS $$
BEGIN
    -- Eliminar duplicados manteniendo el registro con el ID más bajo para cada nombre
    DELETE FROM salas
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY nombre ORDER BY id) as rnum
            FROM salas
        ) t
        WHERE t.rnum > 1
    );
END;
$$ LANGUAGE plpgsql; 