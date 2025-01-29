-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
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

-- Create indexes
CREATE INDEX idx_assignments_organization ON assignments(organization_id);
CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_area ON assignments(area_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_start_time ON assignments(start_time);
CREATE INDEX idx_assignments_end_time ON assignments(end_time);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Assignments are viewable by organization members"
ON assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = assignments.organization_id
    )
);

CREATE POLICY "Assignments can be created by admins"
ON assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = organization_id
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Assignments can be updated by admins"
ON assignments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = assignments.organization_id
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Assignments can be deleted by admins"
ON assignments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND organization_id = assignments.organization_id
        AND role IN ('admin', 'superadmin')
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 