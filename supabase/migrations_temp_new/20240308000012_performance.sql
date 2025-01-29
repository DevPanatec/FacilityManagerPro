-- Create partitioned tables for large datasets
CREATE TABLE IF NOT EXISTS activity_logs_partitioned (
    LIKE activity_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for activity logs
CREATE TABLE activity_logs_y2024m01 PARTITION OF activity_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE activity_logs_y2024m02 PARTITION OF activity_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE activity_logs_y2024m03 PARTITION OF activity_logs_partitioned
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Create hypertable for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('performance_metrics', 'timestamp',
    chunk_time_interval => INTERVAL '1 day');

-- Create composite indexes for common query patterns
CREATE INDEX idx_tasks_composite ON tasks (organization_id, status, priority, due_date);
CREATE INDEX idx_incidents_composite ON incidents (organization_id, status, severity, created_at);
CREATE INDEX idx_chat_messages_composite ON chat_messages (organization_id, room_id, created_at);

-- Create partial indexes for specific conditions
CREATE INDEX idx_tasks_overdue ON tasks (due_date)
WHERE status != 'completed' AND due_date < NOW();

CREATE INDEX idx_incidents_active ON incidents (created_at)
WHERE status IN ('open', 'in_progress');

-- Create GiST index for full-text search
CREATE INDEX idx_documentation_articles_fts ON documentation_articles
USING gin(to_tsvector('spanish', title || ' ' || content));

CREATE INDEX idx_chat_messages_fts ON chat_messages
USING gin(to_tsvector('spanish', content));

-- Create function for automatic table maintenance
CREATE OR REPLACE FUNCTION maintain_tables()
RETURNS void AS $$
BEGIN
    -- Vacuum analyze tables
    VACUUM ANALYZE tasks;
    VACUUM ANALYZE incidents;
    VACUUM ANALYZE chat_messages;
    VACUUM ANALYZE activity_logs;
    VACUUM ANALYZE documentation_articles;
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW CONCURRENTLY incident_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY action_plan_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY chat_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY webhook_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY test_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY test_run_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY documentation_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for query performance analysis
CREATE OR REPLACE FUNCTION analyze_query_performance(
    p_query TEXT
) RETURNS TABLE (
    plan_json JSON,
    execution_time NUMERIC,
    planning_time NUMERIC,
    total_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON) EXECUTE p_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for table statistics
CREATE OR REPLACE FUNCTION get_table_statistics(
    p_table_name TEXT
) RETURNS TABLE (
    total_rows BIGINT,
    total_size TEXT,
    index_size TEXT,
    cache_hit_ratio NUMERIC,
    dead_rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT reltuples::BIGINT FROM pg_class WHERE relname = p_table_name) as total_rows,
        pg_size_pretty(pg_total_relation_size(p_table_name)) as total_size,
        pg_size_pretty(pg_indexes_size(p_table_name)) as index_size,
        CASE
            WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
            ELSE (heap_blks_hit::NUMERIC / (heap_blks_hit + heap_blks_read)::NUMERIC) * 100
        END as cache_hit_ratio,
        n_dead_tup as dead_rows
    FROM pg_stat_user_tables
    WHERE relname = p_table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for connection pool statistics
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    total_connections INTEGER,
    active_connections INTEGER,
    idle_connections INTEGER,
    max_connections INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        count(*)::INTEGER as total_connections,
        count(*) FILTER (WHERE state = 'active')::INTEGER as active_connections,
        count(*) FILTER (WHERE state = 'idle')::INTEGER as idle_connections,
        current_setting('max_connections')::INTEGER as max_connections
    FROM pg_stat_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
    table_name TEXT,
    cache_hit_ratio NUMERIC,
    index_hit_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        relname::TEXT as table_name,
        CASE
            WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
            ELSE (heap_blks_hit::NUMERIC / (heap_blks_hit + heap_blks_read)::NUMERIC) * 100
        END as cache_hit_ratio,
        CASE
            WHEN idx_blks_hit + idx_blks_read = 0 THEN 0
            ELSE (idx_blks_hit::NUMERIC / (idx_blks_hit + idx_blks_read)::NUMERIC) * 100
        END as index_hit_ratio
    FROM pg_statio_user_tables;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for performance insights
CREATE MATERIALIZED VIEW performance_insights AS
WITH table_stats AS (
    SELECT
        schemaname,
        relname as table_name,
        seq_scan,
        seq_tup_read,
        idx_scan,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
    FROM pg_stat_user_tables
),
index_stats AS (
    SELECT
        schemaname,
        relname as table_name,
        indexrelname as index_name,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
)
SELECT
    t.table_name,
    t.seq_scan as full_table_scans,
    t.idx_scan as index_scans,
    t.n_live_tup as live_rows,
    t.n_dead_tup as dead_rows,
    CASE
        WHEN t.seq_scan = 0 THEN 0
        ELSE t.seq_tup_read::NUMERIC / t.seq_scan
    END as avg_rows_per_scan,
    array_agg(i.index_name) as indexes,
    array_agg(i.idx_scan) as index_usage
FROM table_stats t
LEFT JOIN index_stats i ON t.table_name = i.table_name
GROUP BY t.schemaname, t.table_name, t.seq_scan, t.seq_tup_read, t.idx_scan,
         t.n_tup_ins, t.n_tup_upd, t.n_tup_del, t.n_live_tup, t.n_dead_tup;

-- Create indexes for performance insights
CREATE INDEX idx_performance_insights_table ON performance_insights(table_name);

-- Enable RLS on performance insights
ALTER MATERIALIZED VIEW performance_insights ENABLE ROW LEVEL SECURITY;

-- Create policy for performance insights
CREATE POLICY "Performance insights are viewable by admins" ON performance_insights
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
            )
        )
    ); 