-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users are viewable by organization members" ON users;
DROP POLICY IF EXISTS "Users can be created by admins" ON users;
DROP POLICY IF EXISTS "Users can be updated by admins" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

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
        NEW.role := 'enterprise';
    END IF;
    
    -- Set default organization if not provided
    IF NEW.organization_id IS NULL THEN
        -- Try to get organization from the creating user
        SELECT organization_id INTO NEW.organization_id
        FROM users
        WHERE id = auth.uid();
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