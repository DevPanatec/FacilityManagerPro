-- Reset all policies
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

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Improved admin check function with caching and security
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _is_admin BOOLEAN;
    _user_id UUID;
BEGIN
    -- Get authenticated user id
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Check cache first
    _is_admin := current_setting('app.is_admin.' || _user_id::text, TRUE)::boolean;
    IF _is_admin IS NOT NULL THEN
        RETURN _is_admin;
    END IF;

    -- If not in cache, check database
    SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE id = _user_id
        AND role IN ('admin', 'superadmin')
        AND status = 'active'
    ) INTO _is_admin;

    -- Cache the result
    PERFORM set_config('app.is_admin.' || _user_id::text, _is_admin::text, TRUE);

    RETURN _is_admin;
END;
$$;

-- Enterprise role check function
CREATE OR REPLACE FUNCTION is_enterprise()
RETURNS BOOLEAN
STABLE
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _is_enterprise BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role = 'enterprise'
        AND status = 'active'
    ) INTO _is_enterprise;
    
    RETURN _is_enterprise;
END;
$$;

-- Users table policies
CREATE POLICY "Users can read public profiles"
ON users FOR SELECT
TO authenticated
USING (
    status = 'active'
    OR id = auth.uid()
    OR is_admin()
    OR (is_enterprise() AND hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    AND (
        NEW.role = OLD.role  -- Can't change own role
        AND NEW.status = OLD.status  -- Can't change own status
        AND NEW.hospital_id = OLD.hospital_id  -- Can't change own hospital
    )
);

CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Enterprise can manage hospital users"
ON users FOR ALL
TO authenticated
USING (
    is_enterprise()
    AND OLD.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
    is_enterprise()
    AND NEW.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND NEW.role NOT IN ('admin', 'superadmin')
);

-- Hospitals table policies
CREATE POLICY "Anyone can read active hospitals"
ON hospitals FOR SELECT
TO authenticated
USING (
    status = 'active' 
    OR is_admin()
    OR (is_enterprise() AND id = (SELECT hospital_id FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Admins can manage hospitals"
ON hospitals FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Enterprise can update own hospital"
ON hospitals FOR UPDATE
TO authenticated
USING (
    is_enterprise()
    AND id = (SELECT hospital_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
    is_enterprise()
    AND id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    AND NEW.id = OLD.id  -- Can't change hospital id
);

-- Activity logs policies with improved performance
CREATE POLICY "Users can read own logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR is_admin()
    OR (
        is_enterprise() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = activity_logs.user_id 
            AND users.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
        )
    )
);

CREATE POLICY "System can create logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
        user_id = auth.uid()
        OR is_admin()
        OR (
            is_enterprise() 
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = activity_logs.user_id 
                AND users.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
            )
        )
    )
);

-- Notifications policies
CREATE POLICY "Users can manage own notifications"
ON notifications FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR is_admin()
    OR (
        is_enterprise() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = notifications.user_id 
            AND users.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
        )
    )
);

-- Storage policies
CREATE POLICY "Manage own avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR is_admin()
        OR (
            is_enterprise() 
            AND (storage.foldername(name))[1] IN (
                SELECT id::text 
                FROM users 
                WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
            )
        )
    )
);

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Realtime security policies
CREATE POLICY "Realtime users access"
ON users
FOR SELECT TO authenticated
USING (
    auth.uid() = id 
    OR is_admin()
    OR (
        is_enterprise() 
        AND hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Realtime hospitals access"
ON hospitals
FOR SELECT TO authenticated
USING (
    status = 'active'
    OR is_admin()
    OR (
        is_enterprise() 
        AND id = (SELECT hospital_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Realtime notifications access"
ON notifications
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR is_admin()
    OR (
        is_enterprise() 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = notifications.user_id 
            AND users.hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
        )
    )
);

-- Function for automatic user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        role,
        first_name,
        last_name,
        status,
        metadata
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'active',
        jsonb_build_object(
            'provider', NEW.app_metadata->>'provider',
            'created_at', extract(epoch from NOW())
        )
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        metadata = users.metadata || EXCLUDED.metadata,
        updated_at = timezone('utc'::text, now());
    
    -- Create default notification preferences
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message
    )
    VALUES (
        NEW.id,
        'welcome',
        'Bienvenido a la plataforma',
        'Gracias por registrarte. Completa tu perfil para comenzar.'
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user(); 

-- Función para verificar acceso a reportes
CREATE OR REPLACE FUNCTION can_access_hospital_reports(hospital_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
    user_hospital_id UUID;
BEGIN
    -- Get user info
    SELECT role, h.id
    INTO user_role, user_hospital_id
    FROM users u
    LEFT JOIN hospitals h ON h.id = u.hospital_id
    WHERE u.id = auth.uid();

    -- Admins can access all reports
    IF user_role IN ('admin', 'superadmin') THEN
        RETURN TRUE;
    END IF;

    -- Enterprise users can only access their hospital's reports
    IF user_role = 'enterprise' AND user_hospital_id = hospital_id THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Policies para reportes y métricas
CREATE POLICY "Report access control"
ON activity_logs
FOR SELECT
TO authenticated
USING (
    can_access_hospital_reports(
        (SELECT hospital_id FROM users WHERE id = user_id)
    )
);

-- Policy para métricas en tiempo real
CREATE POLICY "Realtime metrics access"
ON activity_logs
FOR SELECT
TO authenticated
USING (
    can_access_hospital_reports(
        (SELECT hospital_id FROM users WHERE id = user_id)
    )
    AND created_at >= NOW() - INTERVAL '24 hours'
);

-- Policy para estadísticas de uso
CREATE POLICY "Usage statistics access"
ON activity_logs
FOR SELECT
TO authenticated
USING (
    can_access_hospital_reports(
        (SELECT hospital_id FROM users WHERE id = user_id)
    )
); 