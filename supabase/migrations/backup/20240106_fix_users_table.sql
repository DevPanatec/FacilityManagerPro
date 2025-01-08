-- Disable RLS temporarily for the migration
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Drop existing functions and triggers to avoid conflicts
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Recreate users table with complete structure
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'enterprise', 'usuario')),
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unified update_timestamp function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create unified handle_new_user function with metadata support
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, users.role),
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        metadata = COALESCE(EXCLUDED.metadata, users.metadata),
        updated_at = NOW();

    -- Create default notification preferences
    INSERT INTO notification_preferences (user_id, type, enabled)
    VALUES
        (NEW.id, 'email', true),
        (NEW.id, 'push', true)
    ON CONFLICT DO NOTHING;

    -- Log user creation
    INSERT INTO activity_logs (
        user_id,
        action,
        description,
        metadata
    ) VALUES (
        NEW.id,
        'user_created',
        'New user account created',
        jsonb_build_object(
            'email', NEW.email,
            'role', COALESCE(NEW.raw_user_meta_data->>'role', 'usuario')
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create timestamp trigger
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Create user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_hospital ON users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_users_names ON users(first_name, last_name);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_users_hospital_role ON users(hospital_id, role);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User profiles and metadata';
COMMENT ON COLUMN users.role IS 'User role: superadmin, admin, enterprise, or usuario';
COMMENT ON COLUMN users.status IS 'User status: active, inactive, or pending';
COMMENT ON COLUMN users.metadata IS 'Additional user metadata stored as JSONB';

-- Re-enable RLS (policies will be handled separately)
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 