-- Create maintenance schema if not exists
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION maintenance.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH expired AS (
        DELETE FROM user_sessions
        WHERE expires_at < CURRENT_TIMESTAMP
        OR last_activity < (CURRENT_TIMESTAMP - INTERVAL '24 hours')
        RETURNING id, user_id
    )
    SELECT COUNT(*) INTO deleted_count FROM expired;

    IF deleted_count > 0 THEN
        PERFORM audit.log(
            'SECURITY_EVENT'::audit_action,
            'user_sessions',
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'event_type', 'sessions_cleanup',
                'deleted_count', deleted_count
            )
        );
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up rate limits
CREATE OR REPLACE FUNCTION maintenance.cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits
    WHERE window_start < (CURRENT_TIMESTAMP - INTERVAL '1 hour')
    RETURNING COUNT(*) INTO deleted_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION maintenance.cleanup_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH old_logs AS (
        DELETE FROM audit_logs
        WHERE timestamp < (CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL)
        AND action NOT IN ('SECURITY_EVENT', 'LOGIN_FAILED')
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM old_logs;

    IF deleted_count > 0 THEN
        PERFORM audit.log(
            'SECURITY_EVENT'::audit_action,
            'audit_logs',
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'event_type', 'audit_logs_cleanup',
                'deleted_count', deleted_count,
                'retention_days', retention_days
            )
        );
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up inactive users
CREATE OR REPLACE FUNCTION maintenance.cleanup_inactive_users(inactive_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deactivated_count INTEGER;
BEGIN
    WITH inactive_users AS (
        UPDATE users
        SET status = 'inactive'::user_status
        WHERE status = 'active'::user_status
        AND last_activity < (CURRENT_TIMESTAMP - (inactive_days || ' days')::INTERVAL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deactivated_count FROM inactive_users;

    IF deactivated_count > 0 THEN
        PERFORM audit.log(
            'SECURITY_EVENT'::audit_action,
            'users',
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'event_type', 'users_deactivated',
                'deactivated_count', deactivated_count,
                'inactive_days', inactive_days
            )
        );
    END IF;

    RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vacuum analyze tables
CREATE OR REPLACE FUNCTION maintenance.vacuum_analyze_tables()
RETURNS TABLE(table_name TEXT, status TEXT) AS $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'VACUUM ANALYZE ' || quote_ident(tbl);
            table_name := tbl;
            status := 'success';
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            table_name := tbl;
            status := 'error: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze database health
CREATE OR REPLACE FUNCTION maintenance.analyze_db_health()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH table_stats AS (
        SELECT 
            schemaname,
            relname,
            n_live_tup AS row_count,
            n_dead_tup AS dead_tuples,
            last_vacuum,
            last_analyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
    ),
    index_stats AS (
        SELECT 
            schemaname,
            relname,
            indexrelname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
    )
    SELECT jsonb_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'table_statistics', (
            SELECT jsonb_agg(jsonb_build_object(
                'table_name', relname,
                'row_count', row_count,
                'dead_tuples', dead_tuples,
                'last_vacuum', last_vacuum,
                'last_analyze', last_analyze
            ))
            FROM table_stats
        ),
        'index_statistics', (
            SELECT jsonb_agg(jsonb_build_object(
                'table_name', relname,
                'index_name', indexrelname,
                'scans', idx_scan,
                'tuples_read', idx_tup_read,
                'tuples_fetched', idx_tup_fetch
            ))
            FROM index_stats
        )
    ) INTO result;

    -- Log health check
    PERFORM audit.log(
        'SECURITY_EVENT'::audit_action,
        NULL,
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', 'health_check',
            'result', result
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create maintenance job scheduling table
CREATE TABLE IF NOT EXISTS maintenance_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name TEXT NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    interval_minutes INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT true,
    metadata JSONB
);

-- Insert default maintenance jobs
INSERT INTO maintenance_jobs (job_name, interval_minutes, metadata) VALUES
    ('cleanup_expired_sessions', 60, '{"description": "Removes expired user sessions"}'),
    ('cleanup_rate_limits', 60, '{"description": "Cleans up expired rate limit records"}'),
    ('cleanup_audit_logs', 1440, '{"description": "Archives old audit logs", "retention_days": 90}'),
    ('cleanup_inactive_users', 1440, '{"description": "Deactivates inactive users", "inactive_days": 90}'),
    ('vacuum_analyze_tables', 1440, '{"description": "Maintains database performance"}'),
    ('analyze_db_health', 360, '{"description": "Checks database health metrics"}')
ON CONFLICT (job_name) DO NOTHING;

-- Add comments for documentation
COMMENT ON SCHEMA maintenance IS 'Contains database maintenance and cleanup functions';
COMMENT ON TABLE maintenance_jobs IS 'Schedules and tracks maintenance job execution';
COMMENT ON FUNCTION maintenance.cleanup_expired_sessions IS 'Removes expired user sessions';
COMMENT ON FUNCTION maintenance.cleanup_rate_limits IS 'Cleans up expired rate limit records';
COMMENT ON FUNCTION maintenance.cleanup_audit_logs IS 'Archives old audit logs based on retention policy';
COMMENT ON FUNCTION maintenance.cleanup_inactive_users IS 'Deactivates users who have been inactive for a specified period';
COMMENT ON FUNCTION maintenance.vacuum_analyze_tables IS 'Performs vacuum analyze on all public tables';
COMMENT ON FUNCTION maintenance.analyze_db_health IS 'Generates a report of database health metrics'; 