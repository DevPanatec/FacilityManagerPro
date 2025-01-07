-- Enhance users table with security fields
ALTER TABLE users
ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_login_ip INET,
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN lock_until TIMESTAMP WITH TIME ZONE;

-- Add validation constraints
ALTER TABLE users
ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT name_format CHECK (
  (first_name IS NULL OR first_name ~ '^[A-Za-zÀ-ÿ\s]{2,50}$') AND
  (last_name IS NULL OR last_name ~ '^[A-Za-zÀ-ÿ\s]{2,50}$')
),
ADD CONSTRAINT max_failed_attempts CHECK (failed_login_attempts <= 5);

-- Create index for text search on names
CREATE INDEX idx_users_names_search ON users 
USING GIN (to_tsvector('spanish', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- Create index for audit queries
CREATE INDEX idx_users_audit ON users (last_activity, last_password_change, created_at);

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment failed attempts
  NEW.failed_login_attempts := OLD.failed_login_attempts + 1;
  
  -- Lock account if max attempts reached
  IF NEW.failed_login_attempts >= 5 THEN
    NEW.is_locked := TRUE;
    NEW.lock_until := NOW() + INTERVAL '30 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for failed login attempts
CREATE TRIGGER tr_handle_failed_login
  BEFORE UPDATE OF failed_login_attempts ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_failed_login();

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.failed_login_attempts := 0;
  NEW.is_locked := FALSE;
  NEW.lock_until := NULL;
  NEW.last_activity := NOW();
  NEW.last_login_ip := current_setting('request.headers')::json->>'x-forwarded-for';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for successful login
CREATE TRIGGER tr_reset_failed_login
  BEFORE UPDATE OF last_activity ON users
  FOR EACH ROW
  EXECUTE FUNCTION reset_failed_login_attempts();

-- Function to track password changes
CREATE OR REPLACE FUNCTION track_password_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_password_change := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for password changes
CREATE TRIGGER tr_track_password_change
  BEFORE UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION track_password_change();

-- Comments for documentation
COMMENT ON COLUMN users.last_activity IS 'Timestamp of user''s last activity';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.last_password_change IS 'Timestamp of last password change';
COMMENT ON COLUMN users.last_login_ip IS 'IP address of last successful login';
COMMENT ON COLUMN users.is_locked IS 'Whether the account is temporarily locked';
COMMENT ON COLUMN users.lock_until IS 'Timestamp until which the account is locked'; 