-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create failed authentication attempts table
CREATE TABLE IF NOT EXISTS failed_auth_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ
);

-- Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    password_min_length INTEGER DEFAULT 8,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_special_chars BOOLEAN DEFAULT true,
    password_expiry_days INTEGER DEFAULT 90,
    max_failed_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    session_timeout_minutes INTEGER DEFAULT 60,
    mfa_required BOOLEAN DEFAULT false,
    allowed_ip_ranges TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_security_audit_logs_organization ON security_audit_logs(organization_id);
CREATE INDEX idx_security_audit_logs_user ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_event ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_resource ON security_audit_logs(resource_type, resource_id);
CREATE INDEX idx_security_audit_logs_created ON security_audit_logs(created_at);

CREATE INDEX idx_failed_auth_attempts_organization ON failed_auth_attempts(organization_id);
CREATE INDEX idx_failed_auth_attempts_email ON failed_auth_attempts(email);
CREATE INDEX idx_failed_auth_attempts_ip ON failed_auth_attempts(ip_address);

-- Add triggers for updated_at
CREATE TRIGGER update_security_settings_updated_at
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to log security audit
CREATE OR REPLACE FUNCTION log_security_audit(
    p_organization_id UUID,
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_audit_logs (
        organization_id,
        user_id,
        event_type,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_organization_id,
        auth.uid(),
        p_event_type,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record failed authentication
CREATE OR REPLACE FUNCTION record_failed_auth(
    p_organization_id UUID,
    p_email TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_attempt failed_auth_attempts%ROWTYPE;
    v_settings security_settings%ROWTYPE;
BEGIN
    -- Get security settings
    SELECT * INTO v_settings
    FROM security_settings
    WHERE organization_id = p_organization_id;

    -- Get or create attempt record
    SELECT * INTO v_attempt
    FROM failed_auth_attempts
    WHERE organization_id = p_organization_id
    AND email = p_email
    AND ip_address = p_ip_address
    AND (blocked_until IS NULL OR blocked_until < NOW())
    FOR UPDATE;

    IF v_attempt.id IS NULL THEN
        INSERT INTO failed_auth_attempts (
            organization_id,
            email,
            ip_address,
            user_agent
        ) VALUES (
            p_organization_id,
            p_email,
            p_ip_address,
            p_user_agent
        );
    ELSE
        UPDATE failed_auth_attempts
        SET
            attempt_count = attempt_count + 1,
            last_attempt_at = NOW(),
            blocked_until = CASE
                WHEN attempt_count + 1 >= v_settings.max_failed_attempts
                THEN NOW() + (v_settings.lockout_duration_minutes || ' minutes')::INTERVAL
                ELSE NULL
            END
        WHERE id = v_attempt.id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate password
CREATE OR REPLACE FUNCTION validate_password(
    p_organization_id UUID,
    p_password TEXT
) RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_settings security_settings%ROWTYPE;
BEGIN
    -- Get security settings
    SELECT * INTO v_settings
    FROM security_settings
    WHERE organization_id = p_organization_id;

    -- Check length
    IF LENGTH(p_password) < v_settings.password_min_length THEN
        RETURN QUERY SELECT false, 'Password is too short';
        RETURN;
    END IF;

    -- Check uppercase
    IF v_settings.password_require_uppercase AND p_password !~ '[A-Z]' THEN
        RETURN QUERY SELECT false, 'Password must contain uppercase letters';
        RETURN;
    END IF;

    -- Check lowercase
    IF v_settings.password_require_lowercase AND p_password !~ '[a-z]' THEN
        RETURN QUERY SELECT false, 'Password must contain lowercase letters';
        RETURN;
    END IF;

    -- Check numbers
    IF v_settings.password_require_numbers AND p_password !~ '[0-9]' THEN
        RETURN QUERY SELECT false, 'Password must contain numbers';
        RETURN;
    END IF;

    -- Check special characters
    IF v_settings.password_require_special_chars AND p_password !~ '[^a-zA-Z0-9]' THEN
        RETURN QUERY SELECT false, 'Password must contain special characters';
        RETURN;
    END IF;

    RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check IP access
CREATE OR REPLACE FUNCTION check_ip_access(
    p_organization_id UUID,
    p_ip_address TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_settings security_settings%ROWTYPE;
    v_ip_range TEXT;
BEGIN
    -- Get security settings
    SELECT * INTO v_settings
    FROM security_settings
    WHERE organization_id = p_organization_id;

    -- If no IP restrictions, allow access
    IF v_settings.allowed_ip_ranges IS NULL OR array_length(v_settings.allowed_ip_ranges, 1) = 0 THEN
        RETURN true;
    END IF;

    -- Check each IP range
    FOREACH v_ip_range IN ARRAY v_settings.allowed_ip_ranges
    LOOP
        IF p_ip_address <<= v_ip_range THEN
            RETURN true;
        END IF;
    END LOOP;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for security audit logs
CREATE POLICY "Security audit logs are viewable by admins" ON security_audit_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = security_audit_logs.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for failed auth attempts
CREATE POLICY "Failed auth attempts are viewable by admins" ON failed_auth_attempts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = failed_auth_attempts.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for security settings
CREATE POLICY "Security settings are viewable by organization members" ON security_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            security_settings.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Security settings can be managed by admins" ON security_settings
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = security_settings.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create materialized view for security insights
CREATE MATERIALIZED VIEW security_insights AS
WITH auth_stats AS (
    SELECT
        organization_id,
        DATE_TRUNC('hour', last_attempt_at) as hour,
        COUNT(*) as total_attempts,
        COUNT(DISTINCT email) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(*) FILTER (WHERE blocked_until IS NOT NULL) as blocked_attempts
    FROM failed_auth_attempts
    WHERE last_attempt_at >= NOW() - INTERVAL '24 hours'
    GROUP BY organization_id, DATE_TRUNC('hour', last_attempt_at)
),
audit_stats AS (
    SELECT
        organization_id,
        DATE_TRUNC('hour', created_at) as hour,
        event_type,
        COUNT(*) as event_count
    FROM security_audit_logs
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY organization_id, DATE_TRUNC('hour', created_at), event_type
)
SELECT
    COALESCE(a.organization_id, l.organization_id) as organization_id,
    COALESCE(a.hour, l.hour) as hour,
    a.total_attempts,
    a.unique_users,
    a.unique_ips,
    a.blocked_attempts,
    l.event_type,
    l.event_count
FROM auth_stats a
FULL OUTER JOIN audit_stats l
    ON a.organization_id = l.organization_id
    AND a.hour = l.hour;

-- Create indexes for security insights
CREATE INDEX idx_security_insights_organization ON security_insights(organization_id);
CREATE INDEX idx_security_insights_hour ON security_insights(hour);

-- Enable RLS on security insights
ALTER MATERIALIZED VIEW security_insights ENABLE ROW LEVEL SECURITY;

-- Create policy for security insights
CREATE POLICY "Security insights are viewable by admins" ON security_insights
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = security_insights.organization_id OR users.role = 'superadmin')
            )
        )
    ); 