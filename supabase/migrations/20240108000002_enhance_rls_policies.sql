-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create auth helper functions
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = org_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR auth.is_admin());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Organizations policies
CREATE POLICY "Members can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (auth.is_member(id) OR auth.is_admin());

CREATE POLICY "Only admins can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (auth.is_admin());

CREATE POLICY "Only admins can update organizations"
ON organizations FOR UPDATE
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

CREATE POLICY "Only admins can delete organizations"
ON organizations FOR DELETE
TO authenticated
USING (auth.is_admin());

-- Areas policies
CREATE POLICY "Members can view areas in their organization"
ON areas FOR SELECT
TO authenticated
USING (auth.is_member(organization_id) OR auth.is_admin());

CREATE POLICY "Only admins can create areas"
ON areas FOR INSERT
TO authenticated
WITH CHECK (auth.is_member(organization_id) AND auth.is_admin());

CREATE POLICY "Only admins can update areas"
ON areas FOR UPDATE
TO authenticated
USING (auth.is_member(organization_id) AND auth.is_admin())
WITH CHECK (auth.is_member(organization_id) AND auth.is_admin());

CREATE POLICY "Only admins can delete areas"
ON areas FOR DELETE
TO authenticated
USING (auth.is_member(organization_id) AND auth.is_admin());

-- Staff shifts policies
CREATE POLICY "Users can view shifts in their organization"
ON staff_shifts FOR SELECT
TO authenticated
USING (
  auth.is_member(organization_id) OR 
  user_id = auth.uid() OR 
  auth.is_admin()
);

CREATE POLICY "Admins can create shifts"
ON staff_shifts FOR INSERT
TO authenticated
WITH CHECK (auth.is_member(organization_id) AND auth.is_admin());

CREATE POLICY "Users can update their own shifts"
ON staff_shifts FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR (auth.is_member(organization_id) AND auth.is_admin()))
WITH CHECK (user_id = auth.uid() OR (auth.is_member(organization_id) AND auth.is_admin()));

CREATE POLICY "Only admins can delete shifts"
ON staff_shifts FOR DELETE
TO authenticated
USING (auth.is_member(organization_id) AND auth.is_admin());

-- Tasks policies
CREATE POLICY "Members can view tasks in their organization"
ON tasks FOR SELECT
TO authenticated
USING (
  auth.is_member(organization_id) OR 
  assigned_to = auth.uid() OR 
  auth.is_admin()
);

CREATE POLICY "Members can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.is_member(organization_id));

CREATE POLICY "Members can update tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
  (auth.is_member(organization_id) AND assigned_to = auth.uid()) OR
  auth.is_admin()
)
WITH CHECK (
  (auth.is_member(organization_id) AND assigned_to = auth.uid()) OR
  auth.is_admin()
);

CREATE POLICY "Only admins can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (auth.is_member(organization_id) AND auth.is_admin());

-- Activity logs policies
CREATE POLICY "Users can view their own logs"
ON activity_logs FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  (auth.is_member(organization_id) AND auth.is_admin())
);

CREATE POLICY "System can create logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- No update/delete policies for activity_logs (append-only)

-- Add comments for documentation
COMMENT ON FUNCTION auth.is_admin IS 'Checks if the current user is an admin';
COMMENT ON FUNCTION auth.is_member IS 'Checks if the current user is a member of the specified organization'; 