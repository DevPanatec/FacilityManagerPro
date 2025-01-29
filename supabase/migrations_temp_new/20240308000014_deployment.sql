-- Create deployment settings table
CREATE TABLE IF NOT EXISTS deployment_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    version TEXT NOT NULL,
    last_deployment_at TIMESTAMPTZ,
    last_deployment_by UUID REFERENCES users(id) ON DELETE SET NULL,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT,
    backup_enabled BOOLEAN DEFAULT true,
    backup_frequency TEXT DEFAULT 'daily',
    backup_retention_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deployment logs table
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    executed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changes_summary TEXT,
    error_message TEXT,
    rollback_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create database backups table
CREATE TABLE IF NOT EXISTS database_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    file_url TEXT,
    file_size BIGINT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deployment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_deployment_logs_organization ON deployment_logs(organization_id);
CREATE INDEX idx_deployment_logs_version ON deployment_logs(version);
CREATE INDEX idx_deployment_logs_environment ON deployment_logs(environment);
CREATE INDEX idx_deployment_logs_status ON deployment_logs(status);
CREATE INDEX idx_deployment_logs_created ON deployment_logs(created_at);

CREATE INDEX idx_database_backups_organization ON database_backups(organization_id);
CREATE INDEX idx_database_backups_environment ON database_backups(environment);
CREATE INDEX idx_database_backups_status ON database_backups(status);
CREATE INDEX idx_database_backups_retention ON database_backups(retention_until);

-- Add triggers for updated_at
CREATE TRIGGER update_deployment_settings_updated_at
    BEFORE UPDATE ON deployment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to start deployment
CREATE OR REPLACE FUNCTION start_deployment(
    p_organization_id UUID,
    p_version TEXT,
    p_environment TEXT,
    p_changes_summary TEXT
) RETURNS UUID AS $$
DECLARE
    v_deployment_id UUID;
    v_settings deployment_settings%ROWTYPE;
BEGIN
    -- Get deployment settings
    SELECT * INTO v_settings
    FROM deployment_settings
    WHERE organization_id = p_organization_id
    FOR UPDATE;

    -- Check if maintenance mode is required
    IF v_settings.maintenance_mode THEN
        RAISE EXCEPTION 'System is in maintenance mode';
    END IF;

    -- Create deployment log
    INSERT INTO deployment_logs (
        organization_id,
        version,
        environment,
        status,
        executed_by,
        changes_summary
    ) VALUES (
        p_organization_id,
        p_version,
        p_environment,
        'pending',
        auth.uid(),
        p_changes_summary
    ) RETURNING id INTO v_deployment_id;

    -- Update deployment settings
    UPDATE deployment_settings
    SET
        version = p_version,
        last_deployment_at = NOW(),
        last_deployment_by = auth.uid()
    WHERE organization_id = p_organization_id;

    RETURN v_deployment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete deployment
CREATE OR REPLACE FUNCTION complete_deployment(
    p_deployment_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE deployment_logs
    SET
        status = p_status,
        completed_at = NOW(),
        error_message = p_error_message
    WHERE id = p_deployment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to rollback deployment
CREATE OR REPLACE FUNCTION rollback_deployment(
    p_deployment_id UUID,
    p_rollback_version TEXT
) RETURNS VOID AS $$
DECLARE
    v_deployment deployment_logs%ROWTYPE;
BEGIN
    -- Get deployment
    SELECT * INTO v_deployment
    FROM deployment_logs
    WHERE id = p_deployment_id;

    -- Update deployment status
    UPDATE deployment_logs
    SET
        status = 'rolled_back',
        completed_at = NOW(),
        rollback_version = p_rollback_version
    WHERE id = p_deployment_id;

    -- Update deployment settings
    UPDATE deployment_settings
    SET version = p_rollback_version
    WHERE organization_id = v_deployment.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to start backup
CREATE OR REPLACE FUNCTION start_backup(
    p_organization_id UUID,
    p_environment TEXT,
    p_backup_type TEXT
) RETURNS UUID AS $$
DECLARE
    v_backup_id UUID;
    v_settings deployment_settings%ROWTYPE;
BEGIN
    -- Get deployment settings
    SELECT * INTO v_settings
    FROM deployment_settings
    WHERE organization_id = p_organization_id;

    -- Check if backups are enabled
    IF NOT v_settings.backup_enabled THEN
        RAISE EXCEPTION 'Backups are disabled for this organization';
    END IF;

    -- Create backup record
    INSERT INTO database_backups (
        organization_id,
        environment,
        backup_type,
        status,
        retention_until
    ) VALUES (
        p_organization_id,
        p_environment,
        p_backup_type,
        'pending',
        NOW() + (v_settings.backup_retention_days || ' days')::INTERVAL
    ) RETURNING id INTO v_backup_id;

    RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete backup
CREATE OR REPLACE FUNCTION complete_backup(
    p_backup_id UUID,
    p_status TEXT,
    p_file_url TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE database_backups
    SET
        status = p_status,
        completed_at = NOW(),
        file_url = p_file_url,
        file_size = p_file_size
    WHERE id = p_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for deployment settings
CREATE POLICY "Deployment settings are viewable by organization members" ON deployment_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            deployment_settings.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Deployment settings can be managed by admins" ON deployment_settings
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = deployment_settings.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for deployment logs
CREATE POLICY "Deployment logs are viewable by organization members" ON deployment_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            deployment_logs.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create policies for database backups
CREATE POLICY "Database backups are viewable by admins" ON database_backups
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = database_backups.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create materialized view for deployment metrics
CREATE MATERIALIZED VIEW deployment_metrics AS
WITH deployment_stats AS (
    SELECT
        organization_id,
        environment,
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as total_deployments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_deployments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_deployments,
        COUNT(CASE WHEN status = 'rolled_back' THEN 1 END) as rollbacks,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::INTEGER as avg_duration_seconds
    FROM deployment_logs
    GROUP BY organization_id, environment, DATE_TRUNC('day', created_at)
),
backup_stats AS (
    SELECT
        organization_id,
        environment,
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as total_backups,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_backups,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_backups,
        SUM(file_size) as total_backup_size,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::INTEGER as avg_duration_seconds
    FROM database_backups
    GROUP BY organization_id, environment, DATE_TRUNC('day', created_at)
)
SELECT
    COALESCE(d.organization_id, b.organization_id) as organization_id,
    COALESCE(d.environment, b.environment) as environment,
    COALESCE(d.date, b.date) as date,
    d.total_deployments,
    d.successful_deployments,
    d.failed_deployments,
    d.rollbacks,
    d.avg_duration_seconds as avg_deployment_duration,
    b.total_backups,
    b.successful_backups,
    b.failed_backups,
    b.total_backup_size,
    b.avg_duration_seconds as avg_backup_duration
FROM deployment_stats d
FULL OUTER JOIN backup_stats b
    ON d.organization_id = b.organization_id
    AND d.environment = b.environment
    AND d.date = b.date;

-- Create indexes for deployment metrics
CREATE INDEX idx_deployment_metrics_organization ON deployment_metrics(organization_id);
CREATE INDEX idx_deployment_metrics_environment ON deployment_metrics(environment);
CREATE INDEX idx_deployment_metrics_date ON deployment_metrics(date);

-- Enable RLS on deployment metrics
ALTER MATERIALIZED VIEW deployment_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for deployment metrics
CREATE POLICY "Deployment metrics are viewable by admins" ON deployment_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = deployment_metrics.organization_id OR users.role = 'superadmin')
            )
        )
    ); 