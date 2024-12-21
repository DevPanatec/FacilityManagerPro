-- Crear una función de respaldo
CREATE OR REPLACE FUNCTION backup_tables() RETURNS void AS $$
BEGIN
    -- Crear tablas de respaldo con timestamp
    CREATE TABLE IF NOT EXISTS organizations_backup_20240227 AS SELECT * FROM organizations;
    CREATE TABLE IF NOT EXISTS staff_backup_20240227 AS SELECT * FROM staff;
    CREATE TABLE IF NOT EXISTS areas_backup_20240227 AS SELECT * FROM areas;
    CREATE TABLE IF NOT EXISTS activities_backup_20240227 AS SELECT * FROM activities;
    CREATE TABLE IF NOT EXISTS revenue_backup_20240227 AS SELECT * FROM revenue;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar el respaldo
SELECT backup_tables();

-- Verificar si la extensión uuid-ossp está instalada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para convertir datos existentes
CREATE OR REPLACE FUNCTION convert_ids_to_uuid() RETURNS void AS $$
DECLARE
    org RECORD;
BEGIN
    -- Crear tablas temporales con la nueva estructura
    CREATE TABLE organizations_new (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(255) NOT NULL UNIQUE,
        logo_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );

    -- Copiar datos existentes a las nuevas tablas
    FOR org IN SELECT * FROM organizations LOOP
        INSERT INTO organizations_new (id, nombre, logo_url, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            org.nombre,
            org.logo_url,
            COALESCE(org.created_at, NOW()),
            COALESCE(org.updated_at, NOW())
        );
    END LOOP;

    -- Si todo está bien, renombrar las tablas
    ALTER TABLE organizations RENAME TO organizations_old;
    ALTER TABLE organizations_new RENAME TO organizations;
END;
$$ LANGUAGE plpgsql;

-- Función para revertir cambios si algo sale mal
CREATE OR REPLACE FUNCTION rollback_changes() RETURNS void AS $$
BEGIN
    -- Restaurar desde los backups si es necesario
    DROP TABLE IF EXISTS organizations;
    ALTER TABLE organizations_old RENAME TO organizations;
    
    -- Restaurar los demás datos si es necesario
    RAISE NOTICE 'Cambios revertidos exitosamente';
END;
$$ LANGUAGE plpgsql;

-- Procedimiento principal de migración
DO $$ 
BEGIN
    -- Intentar la migración
    BEGIN
        -- Ejecutar la conversión
        PERFORM convert_ids_to_uuid();
        
        RAISE NOTICE 'Migración completada exitosamente';
    EXCEPTION WHEN OTHERS THEN
        -- Si algo sale mal, hacer rollback
        PERFORM rollback_changes();
        RAISE EXCEPTION 'Error durante la migración: %', SQLERRM;
    END;
END $$;

-- Verificar el resultado
DO $$ 
BEGIN
    -- Verificar que las tablas nuevas existen y tienen datos
    IF (SELECT COUNT(*) FROM organizations) = 0 THEN
        RAISE EXCEPTION 'La migración no preservó los datos correctamente';
    END IF;
    
    RAISE NOTICE 'Verificación completada exitosamente';
END $$; 