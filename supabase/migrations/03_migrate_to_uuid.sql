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

-- ... (resto del código de migración que ya teníamos) ... 