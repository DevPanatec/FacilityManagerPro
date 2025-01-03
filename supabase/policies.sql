-- Eliminar TODAS las políticas existentes de todas las tablas
DO $$ 
DECLARE
    _tbl text;
    _pol text;
BEGIN
    FOR _tbl, _pol IN 
        SELECT pol.tablename, pol.policyname
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol, _tbl);
    END LOOP;
END $$;

-- Deshabilitar temporalmente RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar tabla user_roles si existe
DROP TABLE IF EXISTS user_roles;

-- Recrear función de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recrear triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nuevamente
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Crear una única política por tabla que permita todas las operaciones
CREATE POLICY "authenticated_users_all_operations"
ON users
FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_operations"
ON hospitals
FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_operations"
ON activity_logs
FOR ALL
USING (auth.role() = 'authenticated'); 