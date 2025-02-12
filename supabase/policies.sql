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
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs DISABLE ROW LEVEL SECURITY;

-- Eliminar todos los triggers relacionados
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
DROP TRIGGER IF EXISTS update_webhook_configs_updated_at ON webhook_configs;
DROP TRIGGER IF EXISTS update_webhook_logs_updated_at ON webhook_logs;

-- Eliminar función con CASCADE para manejar dependencias
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Crear función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid();
    
    RETURN user_role IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear función de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recrear todos los triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at
    BEFORE UPDATE ON webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nuevamente
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política base para users (permitir lectura a todos los usuarios autenticados)
CREATE POLICY "users_base_read_policy"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Políticas para modificación de users
CREATE POLICY "allow_update_own_user"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_admin_update_all_users"
ON users
FOR UPDATE
TO authenticated
USING (is_admin());

-- Política para hospitals
CREATE POLICY "allow_read_hospitals"
ON hospitals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_admin_modify_hospitals"
ON hospitals
FOR ALL
TO authenticated
USING (is_admin());

-- Política para activity_logs
DROP POLICY IF EXISTS "allow_insert_own_logs" ON activity_logs;
DROP POLICY IF EXISTS "allow_read_own_logs" ON activity_logs;
DROP POLICY IF EXISTS "allow_admin_read_all_logs" ON activity_logs;

CREATE POLICY "allow_insert_logs"
ON activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_read_own_logs"
ON activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_admin_read_all_logs"
ON activity_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- Política para notification_preferences
CREATE POLICY "allow_manage_own_notifications"
ON notification_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "allow_admin_manage_all_notifications"
ON notification_preferences
FOR ALL
TO authenticated
USING (is_admin());

-- Política para webhook_configs
CREATE POLICY "allow_admin_manage_webhooks"
ON webhook_configs
FOR ALL
TO authenticated
USING (is_admin());

-- Política para webhook_logs
CREATE POLICY "allow_admin_manage_webhook_logs"
ON webhook_logs
FOR ALL
TO authenticated
USING (is_admin());

-- Agregar política para permitir insertar usuarios
CREATE POLICY "allow_insert_users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- También es buena idea agregar una política para usuarios anónimos si estás usando registro
CREATE POLICY "allow_insert_users_anon"
ON users
FOR INSERT
TO anon
WITH CHECK (true);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for employees table
CREATE POLICY "Enable read access for users in same organization" ON employees
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = employees.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

CREATE POLICY "Enable insert for users in same organization" ON employees
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = employees.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

CREATE POLICY "Enable update for users in same organization" ON employees
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = employees.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

-- Políticas para inventory_items
CREATE POLICY IF NOT EXISTS "Enable read access for users in same organization" ON inventory_items
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = inventory_items.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

-- Políticas para work_shifts
CREATE POLICY "Work shifts are viewable by organization members" ON work_shifts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be created by organization members" ON work_shifts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be updated by organization members" ON work_shifts
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be deleted by organization members" ON work_shifts
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Políticas para areas
CREATE POLICY IF NOT EXISTS "Enable read access for users in same organization" ON areas
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = areas.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

-- Políticas para tasks
CREATE POLICY IF NOT EXISTS "Enable read access for users in same organization" ON tasks
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = tasks.organization_id
            AND role IN ('admin', 'enterprise')
        )
    );

-- Políticas para users (solo lectura para miembros de la misma organización)
CREATE POLICY IF NOT EXISTS "Enable read access for users in same organization" ON users
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = users.organization_id
            AND role IN ('admin', 'enterprise')
        )
    ); 