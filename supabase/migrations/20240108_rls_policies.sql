-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.log ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = users.organization_id
  )
);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage users in their organization"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = users.organization_id
  )
);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their organization"
ON user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.organization_id = user_roles.organization_id
  )
);

-- Email queue policies
CREATE POLICY "Users can view their own emails"
ON email_queue FOR SELECT
TO authenticated
USING (
  to = (
    SELECT email FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage email queue"
ON email_queue FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = email_queue.organization_id
  )
);

-- Audit log policies
CREATE POLICY "Admins can view audit logs"
ON audit.log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = organization_id
  )
);

CREATE POLICY "All users can create audit logs"
ON audit.log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Areas policies
CREATE POLICY "Users can view areas in their organization"
ON areas FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage areas"
ON areas FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = areas.organization_id
  )
);

-- Tasks policies
CREATE POLICY "Users can view tasks in their organization"
ON tasks FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage their assigned tasks"
ON tasks FOR ALL
TO authenticated
USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = tasks.organization_id
  )
);

-- Inventory items policies
CREATE POLICY "Users can view inventory in their organization"
ON inventory_items FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage inventory"
ON inventory_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = inventory_items.organization_id
  )
);

-- Documents policies
CREATE POLICY "Users can view documents in their organization"
ON documents FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage documents"
ON documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = documents.organization_id
  )
);

-- Evaluations policies
CREATE POLICY "Users can view their evaluations"
ON evaluations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR evaluator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = evaluations.organization_id
  )
);

CREATE POLICY "Evaluators can create and update evaluations"
ON evaluations FOR ALL
TO authenticated
USING (
  evaluator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = evaluations.organization_id
  )
);

-- Work shifts policies
CREATE POLICY "Users can view work shifts in their organization"
ON work_shifts FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own work shifts"
ON work_shifts FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = work_shifts.organization_id
  )
);

-- Organizations policies
CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage their organization"
ON organizations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND organization_id = organizations.id
  )
);

-- Notification preferences policies
CREATE POLICY "Users can manage their notification preferences"
ON notification_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND organization_id = notifications.organization_id
    )
  )
);

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
ON auth.sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
ON auth.sessions FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
ON auth.sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Webhook policies
CREATE POLICY "Admins can view webhooks"
ON webhooks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage webhooks"
ON webhooks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Webhook config policies
CREATE POLICY "Admins can view webhook configs"
ON webhook_configs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage webhook configs"
ON webhook_configs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Webhook log policies
CREATE POLICY "Admins can view webhook logs"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "System can create webhook logs"
ON webhook_logs FOR INSERT
TO authenticated
WITH CHECK (true); 