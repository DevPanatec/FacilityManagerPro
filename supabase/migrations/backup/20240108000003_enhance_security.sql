-- Enhance users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS security_questions JSONB,
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
    ADD COLUMN IF NOT EXISTS allowed_ips INET[],
    ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[];

-- Add constraints
ALTER TABLE users 
    ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    ADD CONSTRAINT valid_names CHECK (
        length(first_name) BETWEEN 2 AND 50 AND
        length(last_name) BETWEEN 2 AND 50 AND
        first_name ~ '^[A-Za-zÀ-ÿ\s\-'']+$' AND
        last_name ~ '^[A-Za-zÀ-ÿ\s\-'']+$'
    );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING GIN (to_tsvector('spanish', first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_users_audit ON users (created_at, updated_at, last_activity);
CREATE INDEX IF NOT EXISTS idx_users_security ON users (failed_login_attempts, last_password_change);

-- Enhance audit_logs
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    ADD COLUMN IF NOT EXISTS session_id UUID,
    ADD COLUMN IF NOT EXISTS request_id UUID;

-- Create session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    is_mfa_complete BOOLEAN DEFAULT false,
    CONSTRAINT valid_session_ip CHECK (ip_address << '0.0.0.0/0' OR ip_address << '::/0')
);

-- Enable RLS on sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Session policies
CREATE POLICY "sessions_select" ON user_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.check_user_role('superadmin'));

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rate_limit_ip CHECK (ip_address << '0.0.0.0/0' OR ip_address << '::/0')
);

-- Create security events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_security_event_ip CHECK (ip_address << '0.0.0.0/0' OR ip_address << '::/0')
);

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION auth.handle_failed_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
        status = CASE 
            WHEN failed_login_attempts >= 5 THEN 'locked'::user_status
            ELSE status
        END
    WHERE id = NEW.id;
    
    IF NEW.failed_login_attempts >= 5 THEN
        PERFORM auth.log_security_event(
            'account_locked',
            jsonb_build_object(
                'reason', 'excessive_failed_logins',
                'attempts', NEW.failed_login_attempts
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for failed logins
CREATE TRIGGER tr_handle_failed_login
    AFTER UPDATE OF failed_login_attempts ON users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_failed_login();

-- Function to reset failed login attempts
CREATE OR REPLACE FUNCTION auth.reset_failed_login_attempts(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET failed_login_attempts = 0
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate password change
CREATE OR REPLACE FUNCTION auth.validate_password_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure password hasn't been used in last 5 changes
    IF EXISTS (
        SELECT 1 FROM auth.users_password_history
        WHERE user_id = NEW.id
        AND password_hash = NEW.encrypted_password
        AND created_at > (CURRENT_TIMESTAMP - INTERVAL '1 year')
    ) THEN
        RAISE EXCEPTION 'Password has been used recently';
    END IF;

    -- Update last password change timestamp
    UPDATE users
    SET last_password_change = CURRENT_TIMESTAMP
    WHERE id = NEW.id;

    -- Log password change
    PERFORM auth.log_security_event(
        'password_changed',
        jsonb_build_object('user_id', NEW.id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits (ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events (user_id, created_at);

-- Add comments for documentation
COMMENT ON TABLE user_sessions IS 'Stores active user sessions with device information';
COMMENT ON TABLE rate_limits IS 'Tracks API rate limits by IP address';
COMMENT ON TABLE security_events IS 'Logs security-related events';
COMMENT ON FUNCTION auth.handle_failed_login IS 'Handles failed login attempts and account locking';
COMMENT ON FUNCTION auth.reset_failed_login_attempts IS 'Resets the failed login counter for a user';
COMMENT ON FUNCTION auth.validate_password_change IS 'Validates password changes and maintains history'; 