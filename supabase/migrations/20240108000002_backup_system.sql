-- Create backup metadata table
CREATE TABLE IF NOT EXISTS backup_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'logical')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    size_bytes BIGINT,
    file_path TEXT,
    checksum TEXT,
    retention_days INTEGER NOT NULL DEFAULT 30,
    metadata JSONB,
    error_message TEXT
);

-- Enable RLS on backup metadata
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view backup metadata
CREATE POLICY "backup_metadata_select" ON backup_metadata
    FOR SELECT TO authenticated
    USING (auth.check_user_role('superadmin'));

-- Function to initiate a backup
CREATE OR REPLACE FUNCTION maintenance.initiate_backup(
    backup_type TEXT,
    retention_days INTEGER DEFAULT 30,
    metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
BEGIN
    -- Validate backup type
    IF backup_type NOT IN ('full', 'incremental', 'logical') THEN
        RAISE EXCEPTION 'Invalid backup type: %', backup_type;
    END IF;

    -- Create backup record
    INSERT INTO backup_metadata (
        backup_type,
        status,
        retention_days,
        metadata
    ) VALUES (
        backup_type,
        'pending',
        retention_days,
        metadata
    ) RETURNING id INTO backup_id;

    -- Log backup initiation
    PERFORM audit.log(
        'SECURITY_EVENT'::audit_action,
        'backup_metadata',
        backup_id,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', 'backup_initiated',
            'backup_type', backup_type,
            'retention_days', retention_days
        )
    );

    RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update backup status
CREATE OR REPLACE FUNCTION maintenance.update_backup_status(
    backup_id UUID,
    new_status TEXT,
    file_path TEXT DEFAULT NULL,
    size_bytes BIGINT DEFAULT NULL,
    checksum TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Validate status
    IF new_status NOT IN ('pending', 'in_progress', 'completed', 'failed') THEN
        RAISE EXCEPTION 'Invalid backup status: %', new_status;
    END IF;

    -- Update backup record
    UPDATE backup_metadata
    SET status = new_status,
        end_time = CASE WHEN new_status IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END,
        file_path = COALESCE(file_path, backup_metadata.file_path),
        size_bytes = COALESCE(size_bytes, backup_metadata.size_bytes),
        checksum = COALESCE(checksum, backup_metadata.checksum),
        error_message = COALESCE(error_message, backup_metadata.error_message)
    WHERE id = backup_id;

    -- Log backup status update
    PERFORM audit.log(
        'SECURITY_EVENT'::audit_action,
        'backup_metadata',
        backup_id,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', 'backup_status_updated',
            'new_status', new_status,
            'error_message', error_message
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old backups
CREATE OR REPLACE FUNCTION maintenance.cleanup_old_backups()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH old_backups AS (
        SELECT id, file_path
        FROM backup_metadata
        WHERE status = 'completed'
        AND end_time < (CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL)
    )
    DELETE FROM backup_metadata
    WHERE id IN (SELECT id FROM old_backups)
    RETURNING id INTO deleted_count;

    -- Log cleanup
    IF deleted_count > 0 THEN
        PERFORM audit.log(
            'SECURITY_EVENT'::audit_action,
            'backup_metadata',
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'event_type', 'backup_cleanup',
                'deleted_count', deleted_count
            )
        );
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata (status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_start_time ON backup_metadata (start_time);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_end_time ON backup_metadata (end_time);

-- Add comments for documentation
COMMENT ON TABLE backup_metadata IS 'Stores metadata about database backups';
COMMENT ON FUNCTION maintenance.initiate_backup IS 'Initiates a new backup operation';
COMMENT ON FUNCTION maintenance.update_backup_status IS 'Updates the status of a backup operation';
COMMENT ON FUNCTION maintenance.cleanup_old_backups IS 'Cleans up old backup records based on retention policy'; 