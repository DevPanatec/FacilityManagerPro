-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_assignments_organization ON assignments(organization_id);
CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_area ON assignments(area_id);
CREATE INDEX idx_assignments_start_time ON assignments(start_time);

-- Create updated_at trigger
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Assignments are viewable by users in the same organization" ON assignments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND (users.organization_id = assignments.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Assignments can be created by admins and enterprise users" ON assignments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Assignments can be updated by assigned users or admins" ON assignments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            assignments.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = assignments.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Assignments can be deleted by admins" ON assignments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = assignments.organization_id OR users.role = 'superadmin')
            )
        )
    ); 