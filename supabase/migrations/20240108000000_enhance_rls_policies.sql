-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Areas are viewable by organization members" ON areas;
DROP POLICY IF EXISTS "Staff shifts are viewable by organization members" ON staff_shifts;
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create enum for user roles if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'enterprise', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for resource actions if not exists
DO $$ BEGIN
    CREATE TYPE resource_action AS ENUM ('create', 'read', 'update', 'delete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.check_user_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role::user_role = required_role
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to organization
CREATE OR REPLACE FUNCTION auth.check_user_organization(org_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      hospital_id = org_id
      OR auth.check_user_role('superadmin')
    )
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission for action
CREATE OR REPLACE FUNCTION auth.check_permission(action resource_action, resource text)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superadmin can do everything
  IF auth.check_user_role('superadmin') THEN
    RETURN TRUE;
  END IF;

  -- Check specific permissions based on role and resource
  RETURN EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.status = 'active'
    AND (
      -- Admins can manage their organization
      (u.role = 'admin' AND action IN ('read', 'create', 'update'))
      OR
      -- Enterprise users can manage their own data
      (u.role = 'enterprise' AND action = 'read')
      OR
      -- Regular users can only read
      (u.role = 'usuario' AND action = 'read')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policies
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT TO authenticated
  USING (auth.check_user_organization(id));

CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.check_permission('create'::resource_action, 'organizations'));

CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE TO authenticated
  USING (auth.check_user_organization(id))
  WITH CHECK (auth.check_permission('update'::resource_action, 'organizations'));

CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE TO authenticated
  USING (auth.check_user_role('superadmin'));

-- Areas Policies
CREATE POLICY "areas_select" ON areas
  FOR SELECT TO authenticated
  USING (auth.check_user_organization(org_id));

CREATE POLICY "areas_insert" ON areas
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.check_user_organization(org_id) AND
    auth.check_permission('create'::resource_action, 'areas')
  );

CREATE POLICY "areas_update" ON areas
  FOR UPDATE TO authenticated
  USING (auth.check_user_organization(org_id))
  WITH CHECK (auth.check_permission('update'::resource_action, 'areas'));

CREATE POLICY "areas_delete" ON areas
  FOR DELETE TO authenticated
  USING (
    auth.check_user_organization(org_id) AND
    auth.check_permission('delete'::resource_action, 'areas')
  );

-- Staff Shifts Policies
CREATE POLICY "staff_shifts_select" ON staff_shifts
  FOR SELECT TO authenticated
  USING (
    auth.check_user_organization(organization_id) OR
    user_id = auth.uid()
  );

CREATE POLICY "staff_shifts_insert" ON staff_shifts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.check_user_organization(organization_id) AND
    auth.check_permission('create'::resource_action, 'staff_shifts')
  );

CREATE POLICY "staff_shifts_update" ON staff_shifts
  FOR UPDATE TO authenticated
  USING (
    (auth.check_user_organization(organization_id) OR user_id = auth.uid()) AND
    auth.check_permission('update'::resource_action, 'staff_shifts')
  );

CREATE POLICY "staff_shifts_delete" ON staff_shifts
  FOR DELETE TO authenticated
  USING (
    auth.check_user_organization(organization_id) AND
    auth.check_permission('delete'::resource_action, 'staff_shifts')
  );

-- Tasks Policies
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated
  USING (auth.check_user_organization(organization_id));

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.check_user_organization(organization_id) AND
    auth.check_permission('create'::resource_action, 'tasks')
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (auth.check_user_organization(organization_id))
  WITH CHECK (auth.check_permission('update'::resource_action, 'tasks'));

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (
    auth.check_user_organization(organization_id) AND
    auth.check_permission('delete'::resource_action, 'tasks')
  );

-- Users Policies
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    auth.check_user_role('admin') OR
    auth.check_user_role('superadmin')
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.check_permission('create'::resource_action, 'users'));

CREATE POLICY "users_update" ON users
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid() OR
    auth.check_user_role('admin') OR
    auth.check_user_role('superadmin')
  )
  WITH CHECK (auth.check_permission('update'::resource_action, 'users'));

CREATE POLICY "users_delete" ON users
  FOR DELETE TO authenticated
  USING (auth.check_user_role('superadmin'));

-- Activity Logs Policies
CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.check_user_role('admin') OR
    auth.check_user_role('superadmin')
  );

CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    auth.check_user_role('admin') OR
    auth.check_user_role('superadmin')
  );

-- No update or delete policies for activity_logs (immutable)

-- Add comments for documentation
COMMENT ON FUNCTION auth.check_user_role IS 'Checks if the current user has the specified role';
COMMENT ON FUNCTION auth.check_user_organization IS 'Checks if the current user belongs to the specified organization';
COMMENT ON FUNCTION auth.check_permission IS 'Checks if the current user has permission for the specified action on a resource'; 