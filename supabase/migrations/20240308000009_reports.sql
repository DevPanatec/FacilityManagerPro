-- Create report configurations table
CREATE TABLE IF NOT EXISTS report_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('incident', 'action_plan', 'chat', 'webhook')),
    filters JSONB DEFAULT '{}',
    columns JSONB NOT NULL,
    sort_by TEXT,
    sort_direction TEXT CHECK (sort_direction IN ('asc', 'desc')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduled reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES report_configurations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schedule TEXT NOT NULL, -- cron expression
    recipients JSONB NOT NULL, -- array of email addresses
    format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf')),
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create report executions table
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES report_configurations(id) ON DELETE CASCADE,
    scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    file_url TEXT,
    file_size INTEGER,
    row_count INTEGER,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_report_configurations_organization ON report_configurations(organization_id);
CREATE INDEX idx_report_configurations_type ON report_configurations(type);
CREATE INDEX idx_scheduled_reports_organization ON scheduled_reports(organization_id);
CREATE INDEX idx_scheduled_reports_configuration ON scheduled_reports(configuration_id);
CREATE INDEX idx_report_executions_organization ON report_executions(organization_id);
CREATE INDEX idx_report_executions_configuration ON report_executions(configuration_id);
CREATE INDEX idx_report_executions_scheduled_report ON report_executions(scheduled_report_id);
CREATE INDEX idx_report_executions_status ON report_executions(status);

-- Add triggers for updated_at
CREATE TRIGGER update_report_configurations_updated_at
    BEFORE UPDATE ON report_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_report_configurations_changes
    AFTER INSERT OR UPDATE OR DELETE ON report_configurations
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_scheduled_reports_changes
    AFTER INSERT OR UPDATE OR DELETE ON scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_report_executions_changes
    AFTER INSERT OR UPDATE OR DELETE ON report_executions
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create views for common reports
CREATE MATERIALIZED VIEW incident_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    type,
    severity,
    status,
    COUNT(*) as total_incidents,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolution_date, NOW()) - created_at))/3600)::NUMERIC(10,2) as avg_resolution_time_hours,
    COUNT(CASE WHEN resolution_date IS NOT NULL THEN 1 END) as resolved_incidents,
    COUNT(CASE WHEN resolution_date IS NULL THEN 1 END) as open_incidents
FROM incidents
GROUP BY organization_id, DATE_TRUNC('day', created_at), type, severity, status;

CREATE MATERIALIZED VIEW action_plan_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    status,
    priority,
    COUNT(*) as total_plans,
    AVG(EXTRACT(EPOCH FROM (COALESCE(completed_date, NOW()) - created_at))/3600)::NUMERIC(10,2) as avg_completion_time_hours,
    COUNT(CASE WHEN completed_date IS NOT NULL THEN 1 END) as completed_plans,
    COUNT(CASE WHEN completed_date IS NULL THEN 1 END) as pending_plans
FROM action_plans
GROUP BY organization_id, DATE_TRUNC('day', created_at), status, priority;

CREATE MATERIALIZED VIEW chat_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    type as message_type,
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT room_id) as active_rooms
FROM chat_messages
GROUP BY organization_id, DATE_TRUNC('day', created_at), type;

CREATE MATERIALIZED VIEW webhook_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    event_type,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN response_status BETWEEN 200 AND 299 THEN 1 END) as successful_webhooks,
    COUNT(CASE WHEN response_status NOT BETWEEN 200 AND 299 THEN 1 END) as failed_webhooks,
    AVG(duration)::INTEGER as avg_duration_ms
FROM webhook_logs
GROUP BY organization_id, DATE_TRUNC('day', created_at), event_type;

-- Create indexes for materialized views
CREATE INDEX idx_incident_metrics_organization ON incident_metrics(organization_id);
CREATE INDEX idx_incident_metrics_date ON incident_metrics(date);
CREATE INDEX idx_action_plan_metrics_organization ON action_plan_metrics(organization_id);
CREATE INDEX idx_action_plan_metrics_date ON action_plan_metrics(date);
CREATE INDEX idx_chat_metrics_organization ON chat_metrics(organization_id);
CREATE INDEX idx_chat_metrics_date ON chat_metrics(date);
CREATE INDEX idx_webhook_metrics_organization ON webhook_metrics(organization_id);
CREATE INDEX idx_webhook_metrics_date ON webhook_metrics(date);

-- Create function to refresh metrics
CREATE OR REPLACE FUNCTION refresh_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY incident_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY action_plan_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY chat_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY webhook_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for report configurations
CREATE POLICY "Report configurations are viewable by organization members" ON report_configurations
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            report_configurations.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            ) AND (
                report_configurations.is_public OR
                report_configurations.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.role IN ('superadmin', 'admin', 'enterprise')
                    AND (users.organization_id = report_configurations.organization_id OR users.role = 'superadmin')
                )
            )
        )
    );

CREATE POLICY "Report configurations can be created by admins and enterprise users" ON report_configurations
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

CREATE POLICY "Report configurations can be updated by their creators or admins" ON report_configurations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            report_configurations.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = report_configurations.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for scheduled reports
CREATE POLICY "Scheduled reports are viewable by organization members" ON scheduled_reports
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            scheduled_reports.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Scheduled reports can be managed by admins" ON scheduled_reports
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = scheduled_reports.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for report executions
CREATE POLICY "Report executions are viewable by organization members" ON report_executions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            report_executions.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Enable RLS on materialized views
ALTER MATERIALIZED VIEW incident_metrics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW action_plan_metrics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW chat_metrics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW webhook_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for metrics views
CREATE POLICY "Metrics are viewable by organization members" ON incident_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Metrics are viewable by organization members" ON action_plan_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Metrics are viewable by organization members" ON chat_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Metrics are viewable by organization members" ON webhook_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 