-- Create user roles type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'enterprise', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'enterprise';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to users if it doesn't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create RLS policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by their members"
ON organizations
FOR SELECT
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.organization_id = organizations.id
        AND users.id = auth.uid()
    )
);

CREATE POLICY "Organizations can be created by admins"
ON organizations
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

CREATE POLICY "Organizations can be updated by admins"
ON organizations
FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Create function to create a default organization and admin user
CREATE OR REPLACE FUNCTION create_default_organization_and_admin(
    org_name TEXT,
    admin_email TEXT,
    admin_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_id UUID;
    admin_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name)
    VALUES (org_name)
    RETURNING id INTO org_id;

    -- Create admin user
    INSERT INTO auth.users (email, password, email_confirmed_at)
    VALUES (admin_email, admin_password, NOW())
    RETURNING id INTO admin_id;

    -- Update user role and organization
    UPDATE users
    SET role = 'admin',
        organization_id = org_id
    WHERE id = admin_id;

    RETURN org_id;
END;
$$;

-- Create function to create enterprise users
CREATE OR REPLACE FUNCTION create_enterprise_user(
    org_id UUID,
    user_email TEXT,
    user_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Verify organization exists
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = org_id) THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;

    -- Create enterprise user
    INSERT INTO auth.users (email, password, email_confirmed_at)
    VALUES (user_email, user_password, NOW())
    RETURNING id INTO user_id;

    -- Update user role and organization
    UPDATE users
    SET role = 'enterprise',
        organization_id = org_id
    WHERE id = user_id;

    RETURN user_id;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 