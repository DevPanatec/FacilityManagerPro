-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users are viewable by organization members" ON users;
DROP POLICY IF EXISTS "Users can be created by admins" ON users;
DROP POLICY IF EXISTS "Users can be updated by admins" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies for users table
CREATE POLICY "Users are viewable by organization members"
ON users
FOR SELECT
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Users can be created by admins"
ON users
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.organization_id = organization_id
        )
    )
);

CREATE POLICY "Users can be updated by admins"
ON users
FOR UPDATE
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.organization_id = organization_id
        )
    )
);

-- Drop existing policies for organizations table
DROP POLICY IF EXISTS "Organizations are viewable by their members" ON organizations;
DROP POLICY IF EXISTS "Organizations can be created by admins" ON organizations;
DROP POLICY IF EXISTS "Organizations can be updated by admins" ON organizations;

-- Create new policies for organizations table
CREATE POLICY "Organizations are viewable by their members"
ON organizations
FOR SELECT
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.organization_id = organizations.id
            AND users.id = auth.uid()
        )
    )
);

CREATE POLICY "Organizations can be created by admins"
ON organizations
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
);

CREATE POLICY "Organizations can be updated by admins"
ON organizations
FOR UPDATE
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
); 