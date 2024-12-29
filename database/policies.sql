-- Habilitar RLS para todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
-- ... (habilitar para todas las tablas)

-- 1️⃣ Políticas de Organización

-- Política de acceso a organizaciones
CREATE POLICY organization_access_policy ON organizations
    FOR ALL
    TO authenticated
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Política de configuración de organización
CREATE POLICY organization_settings_policy ON organization_settings
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 2️⃣ Políticas de Usuario y Autenticación

-- Política de acceso a perfiles
CREATE POLICY profile_access_policy ON profiles
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Política de roles
CREATE POLICY role_based_access_policy ON roles
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 3️⃣ Políticas de Estructura Organizacional

-- Política de departamentos
CREATE POLICY department_access_policy ON departments
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 4️⃣ Políticas de Tareas

-- Política de visualización de tareas
CREATE POLICY task_view_policy ON tasks
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Política de creación de tareas
CREATE POLICY task_create_policy ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 5️⃣ Políticas de Personal

-- Política de registros de empleados
CREATE POLICY employee_data_policy ON employee_records
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Política de asistencia
CREATE POLICY attendance_policy ON attendance_records
    FOR ALL
    TO authenticated
    USING (
        employee_id IN (
            SELECT id 
            FROM employee_records 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- 6️⃣ Políticas de Comunicación

-- Política de notificaciones
CREATE POLICY notification_policy ON notifications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Política de chat
CREATE POLICY chat_access_policy ON chat_rooms
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 7️⃣ Políticas de Auditoría

-- Política de logs
CREATE POLICY log_access_policy ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Política de métricas
CREATE POLICY metrics_access_policy ON performance_metrics
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE user_id = auth.uid()
        )
    ); 