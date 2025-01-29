-- Users policies
DROP POLICY IF EXISTS "Users are viewable by organization members" ON users;
DROP POLICY IF EXISTS "Users can be created by organization admins" ON users;
DROP POLICY IF EXISTS "Users can be updated by organization admins or themselves" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can view their own data and organization members" ON users;
DROP POLICY IF EXISTS "Users can update their own data or admins can update" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (this should be the first policy)
CREATE POLICY "Service role has full access" ON users
    FOR ALL USING (
        auth.jwt()->>'role' = 'service_role'
    );

-- Allow authenticated users to view their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (
        auth.uid() = id OR
        (
            auth.role() = 'authenticated' AND
            users.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        ) OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'superadmin'
        )
    );

-- Allow admins to create users
CREATE POLICY "Users can be created by organization admins" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role IN ('superadmin', 'admin')
            AND (admin_user.organization_id = users.organization_id OR admin_user.role = 'superadmin')
        )
    );

-- Allow users to update their own data or admins to update organization users
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role IN ('superadmin', 'admin')
            AND (admin_user.organization_id = users.organization_id OR admin_user.role = 'superadmin')
        )
    ); 