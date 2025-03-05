-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can be created by organization admins" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies without recursion
CREATE POLICY "Service role has full access"
ON users FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view own and organization data"
ON users FOR SELECT
USING (
    -- Users can always view their own data
    id = auth.uid()
    OR 
    -- Users in the same organization with appropriate roles can view other users
    (
        EXISTS (
            SELECT 1 
            FROM users viewer 
            WHERE viewer.id = auth.uid()
            AND viewer.organization_id = users.organization_id
            AND viewer.role IN ('admin', 'enterprise', 'superadmin')
        )
    )
    OR
    -- Superadmins can view all users
    EXISTS (
        SELECT 1 
        FROM users admin 
        WHERE admin.id = auth.uid() 
        AND admin.role = 'superadmin'
    )
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (
    -- Users can update their own profile
    id = auth.uid()
    OR
    -- Admins can update users in their organization
    EXISTS (
        SELECT 1 
        FROM users admin 
        WHERE admin.id = auth.uid()
        AND admin.role IN ('admin', 'superadmin')
        AND (
            admin.organization_id = users.organization_id 
            OR admin.role = 'superadmin'
        )
    )
);

CREATE POLICY "Admins can create users"
ON users FOR INSERT
WITH CHECK (
    -- Only admins and superadmins can create users
    EXISTS (
        SELECT 1 
        FROM users admin 
        WHERE admin.id = auth.uid()
        AND admin.role IN ('admin', 'superadmin')
        AND (
            admin.organization_id = NEW.organization_id 
            OR admin.role = 'superadmin'
        )
    )
);

-- Grant basic permissions
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated; 