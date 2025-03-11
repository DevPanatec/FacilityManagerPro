-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users are viewable by organization members" ON users;
DROP POLICY IF EXISTS "Users can be created by admins" ON users;
DROP POLICY IF EXISTS "Users can be updated by admins" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Drop existing user_role type if exists
DROP TYPE IF EXISTS user_role;

-- Create new user_role type with all possible roles
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'enterprise', 'usuario', 'support');

-- Alter users table to use the new type
ALTER TABLE users 
    ALTER COLUMN role TYPE user_role 
    USING role::user_role;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies for users table
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (
    -- Users can view their own data
    id = auth.uid()
    OR
    -- Admins can view users in their organization
    EXISTS (
        SELECT 1 
        FROM users admin_check
        WHERE admin_check.id = auth.uid()
        AND admin_check.role IN ('admin', 'superadmin')
        AND admin_check.organization_id = users.organization_id
    )
);

CREATE POLICY "Users can be created by admins"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
    -- Superadmins can create any user
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
    )
    OR
    -- Admins can create users in their organization
    EXISTS (
        SELECT 1 
        FROM users admin_check
        WHERE admin_check.id = auth.uid()
        AND admin_check.role = 'admin'
        AND admin_check.organization_id = organization_id
    )
);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own data
    id = auth.uid()
    OR
    -- Admins can update users in their organization
    EXISTS (
        SELECT 1 
        FROM users admin_check
        WHERE admin_check.id = auth.uid()
        AND admin_check.role IN ('admin', 'superadmin')
        AND admin_check.organization_id = users.organization_id
    )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default role if not provided
    IF NEW.role IS NULL THEN
        NEW.role := 'usuario';
    END IF;
    
    -- Set default organization if not provided
    IF NEW.organization_id IS NULL THEN
        -- Try to get organization from the creating user
        SELECT organization_id INTO NEW.organization_id
        FROM users
        WHERE id = auth.uid();
    END IF;
    
    -- Set default status if not provided
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create a function to create the first superadmin
CREATE OR REPLACE FUNCTION create_first_superadmin(
    email TEXT,
    password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name)
    VALUES ('Default Organization')
    RETURNING id INTO org_id;

    -- Create user in auth.users
    INSERT INTO auth.users (email, password, email_confirmed_at)
    VALUES (email, password, NOW())
    RETURNING id INTO user_id;

    -- Create user in public.users
    INSERT INTO users (id, email, role, organization_id, status)
    VALUES (user_id, email, 'superadmin', org_id, 'active');

    RETURN user_id;
END;
$$; 