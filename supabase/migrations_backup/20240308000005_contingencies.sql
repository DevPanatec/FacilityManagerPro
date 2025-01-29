-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('security', 'maintenance', 'health_safety', 'environmental', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create action plans table
CREATE TABLE IF NOT EXISTS action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create action steps table
CREATE TABLE IF NOT EXISTS action_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_plan_id UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident attachments table
CREATE TABLE IF NOT EXISTS incident_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_attachments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_area ON incidents(area_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_action_plans_organization ON action_plans(organization_id);
CREATE INDEX idx_action_plans_incident ON action_plans(incident_id);
CREATE INDEX idx_action_plans_assigned_to ON action_plans(assigned_to);
CREATE INDEX idx_action_steps_organization ON action_steps(organization_id);
CREATE INDEX idx_action_steps_plan ON action_steps(action_plan_id);
CREATE INDEX idx_action_steps_assigned_to ON action_steps(assigned_to);
CREATE INDEX idx_incident_attachments_organization ON incident_attachments(organization_id);
CREATE INDEX idx_incident_attachments_incident ON incident_attachments(incident_id);

-- Add triggers for updated_at
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at
    BEFORE UPDATE ON action_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_steps_updated_at
    BEFORE UPDATE ON action_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_attachments_updated_at
    BEFORE UPDATE ON incident_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_incidents_changes
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_action_plans_changes
    AFTER INSERT OR UPDATE OR DELETE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_action_steps_changes
    AFTER INSERT OR UPDATE OR DELETE ON action_steps
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_incident_attachments_changes
    AFTER INSERT OR UPDATE OR DELETE ON incident_attachments
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create notification trigger for incidents
CREATE OR REPLACE FUNCTION notify_incident_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify on new incident
    IF TG_OP = 'INSERT' THEN
        -- Notify admins and enterprise users
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT 
            NEW.organization_id,
            u.id,
            'Nuevo incidente reportado',
            'Se ha reportado un incidente de severidad ' || NEW.severity || ': ' || NEW.title,
            'incident_created'
        FROM users u
        WHERE u.organization_id = NEW.organization_id
        AND u.role IN ('superadmin', 'admin', 'enterprise');

    -- Notify on status change
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Notify reporter and assigned user
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT DISTINCT
            NEW.organization_id,
            u.id,
            'Estado de incidente actualizado',
            'El incidente "' || NEW.title || '" ha cambiado a estado: ' || NEW.status,
            'incident_status_changed'
        FROM users u
        WHERE u.id IN (NEW.reported_by, NEW.assigned_to)
        AND u.id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_incident_changes_trigger
    AFTER INSERT OR UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION notify_incident_changes();

-- Create notification trigger for action plans
CREATE OR REPLACE FUNCTION notify_action_plan_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify on new action plan
    IF TG_OP = 'INSERT' THEN
        -- Notify assigned user and incident reporter
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT DISTINCT
            NEW.organization_id,
            u.id,
            'Nuevo plan de acción creado',
            'Se ha creado un nuevo plan de acción: ' || NEW.title,
            'action_plan_created'
        FROM users u
        WHERE u.id IN (
            NEW.assigned_to,
            (SELECT reported_by FROM incidents WHERE id = NEW.incident_id)
        )
        AND u.id IS NOT NULL
        AND u.id != NEW.created_by;

    -- Notify on status change
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Notify assigned user and incident reporter
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT DISTINCT
            NEW.organization_id,
            u.id,
            'Estado de plan de acción actualizado',
            'El plan de acción "' || NEW.title || '" ha cambiado a estado: ' || NEW.status,
            'action_plan_status_changed'
        FROM users u
        WHERE u.id IN (
            NEW.assigned_to,
            NEW.created_by,
            (SELECT reported_by FROM incidents WHERE id = NEW.incident_id)
        )
        AND u.id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_action_plan_changes_trigger
    AFTER INSERT OR UPDATE ON action_plans
    FOR EACH ROW
    EXECUTE FUNCTION notify_action_plan_changes();

-- Create policies for incidents
CREATE POLICY "Incidents are viewable by organization members" ON incidents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            incidents.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Incidents can be created by organization members" ON incidents
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Incidents can be updated by assigned users or admins" ON incidents
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            incidents.assigned_to = auth.uid() OR
            incidents.reported_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = incidents.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for action plans
CREATE POLICY "Action plans are viewable by organization members" ON action_plans
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            action_plans.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Action plans can be created by admins and enterprise users" ON action_plans
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

CREATE POLICY "Action plans can be updated by assigned users or admins" ON action_plans
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            action_plans.assigned_to = auth.uid() OR
            action_plans.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = action_plans.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for action steps
CREATE POLICY "Action steps are viewable by organization members" ON action_steps
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            action_steps.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Action steps can be created by action plan owners" ON action_steps
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM action_plans
                WHERE action_plans.id = NEW.action_plan_id
                AND (
                    action_plans.created_by = auth.uid() OR
                    action_plans.assigned_to = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.role IN ('superadmin', 'admin', 'enterprise')
                        AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
                    )
                )
            )
        )
    );

CREATE POLICY "Action steps can be updated by assigned users or admins" ON action_steps
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            action_steps.assigned_to = auth.uid() OR
            EXISTS (
                SELECT 1 FROM action_plans
                WHERE action_plans.id = action_steps.action_plan_id
                AND (
                    action_plans.created_by = auth.uid() OR
                    action_plans.assigned_to = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.role IN ('superadmin', 'admin', 'enterprise')
                        AND (users.organization_id = action_steps.organization_id OR users.role = 'superadmin')
                    )
                )
            )
        )
    );

-- Create policies for incident attachments
CREATE POLICY "Incident attachments are viewable by organization members" ON incident_attachments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            incident_attachments.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Incident attachments can be created by incident participants" ON incident_attachments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM incidents
                WHERE incidents.id = NEW.incident_id
                AND (
                    incidents.reported_by = auth.uid() OR
                    incidents.assigned_to = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.role IN ('superadmin', 'admin', 'enterprise')
                        AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
                    )
                )
            )
        )
    );

CREATE POLICY "Incident attachments can be updated by their uploaders or admins" ON incident_attachments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            incident_attachments.uploaded_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = incident_attachments.organization_id OR users.role = 'superadmin')
            )
        )
    ); 