-- Temporarily disable RLS on users table for debugging
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Allow the service role to have full access
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access" ON users
    FOR ALL 
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Dar permisos al rol anon
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated; 