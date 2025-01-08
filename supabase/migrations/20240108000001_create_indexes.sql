-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_areas_org ON areas(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_user ON staff_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_org ON staff_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id); 