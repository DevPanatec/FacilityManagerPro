-- Fix user security function to prevent recursion during login
CREATE OR REPLACE FUNCTION public.check_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Permitir actualizaciones del sistema (cuando no hay usuario autenticado)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Permitir la actualización si es el usuario superadmin
    IF NEW.email = 'superadmin@facilitymanagerpro.com' THEN
        RETURN NEW;
    END IF;

    -- Permitir actualizaciones cuando el usuario está configurando su cuenta
    IF OLD.last_login_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Para el resto de casos, aplicar las reglas normales
    IF NOT (
        -- El usuario puede actualizar su propio perfil
        auth.uid() = OLD.id 
        OR 
        -- O es un admin/superadmin de la misma organización
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND (organization_id = OLD.organization_id OR role = 'superadmin')
        )
    ) THEN
        RAISE EXCEPTION 'No tienes permiso para actualizar este usuario';
    END IF;

    RETURN NEW;
END;
$$;

-- Simplificar las políticas RLS para users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile only" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Crear políticas simplificadas
CREATE POLICY "allow_system_operations" ON users
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_read_own_and_org" ON users
FOR SELECT TO authenticated
USING (
    id = auth.uid() 
    OR 
    organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
    )
);

CREATE POLICY "allow_update_own_profile" ON users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "allow_admin_operations" ON users
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin')
        AND (organization_id = users.organization_id OR role = 'superadmin')
    )
); 