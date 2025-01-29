-- Create test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('unit', 'integration', 'e2e', 'performance')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')),
    test_data JSONB,
    expected_results JSONB,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test runs table
CREATE TABLE IF NOT EXISTS test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration INTEGER, -- in milliseconds
    actual_results JSONB,
    error_message TEXT,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    operation TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    duration INTEGER NOT NULL, -- in milliseconds
    memory_usage INTEGER, -- in bytes
    cpu_usage NUMERIC(5,2), -- percentage
    error_count INTEGER DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_test_cases_organization ON test_cases(organization_id);
CREATE INDEX idx_test_cases_module ON test_cases(module);
CREATE INDEX idx_test_cases_type ON test_cases(type);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_runs_organization ON test_runs(organization_id);
CREATE INDEX idx_test_runs_test_case ON test_runs(test_case_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
CREATE INDEX idx_test_runs_environment ON test_runs(environment);
CREATE INDEX idx_performance_metrics_organization ON performance_metrics(organization_id);
CREATE INDEX idx_performance_metrics_module ON performance_metrics(module);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Add triggers for updated_at
CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_test_cases_changes
    AFTER INSERT OR UPDATE OR DELETE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_test_runs_changes
    AFTER INSERT OR UPDATE OR DELETE ON test_runs
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create function to run test case
CREATE OR REPLACE FUNCTION run_test_case(
    p_test_case_id UUID,
    p_environment TEXT
) RETURNS UUID AS $$
DECLARE
    v_test_case test_cases%ROWTYPE;
    v_run_id UUID;
BEGIN
    -- Get test case
    SELECT * INTO v_test_case
    FROM test_cases
    WHERE id = p_test_case_id
    AND status = 'active';

    -- If test case not found or not active, return null
    IF v_test_case IS NULL THEN
        RETURN NULL;
    END IF;

    -- Create test run
    INSERT INTO test_runs (
        organization_id,
        test_case_id,
        status,
        environment,
        created_by
    ) VALUES (
        v_test_case.organization_id,
        v_test_case.id,
        'pending',
        p_environment,
        auth.uid()
    ) RETURNING id INTO v_run_id;

    -- Note: The actual test execution will be handled by an Edge Function
    -- This function just creates the run entry and returns its ID

    RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update test run
CREATE OR REPLACE FUNCTION update_test_run(
    p_run_id UUID,
    p_status TEXT,
    p_actual_results JSONB,
    p_error_message TEXT,
    p_duration INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE test_runs
    SET
        status = p_status,
        actual_results = p_actual_results,
        error_message = p_error_message,
        duration = p_duration,
        completed_at = NOW()
    WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record performance metric
CREATE OR REPLACE FUNCTION record_performance_metric(
    p_organization_id UUID,
    p_module TEXT,
    p_operation TEXT,
    p_environment TEXT,
    p_duration INTEGER,
    p_memory_usage INTEGER DEFAULT NULL,
    p_cpu_usage NUMERIC DEFAULT NULL,
    p_error_count INTEGER DEFAULT 0,
    p_user_count INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
BEGIN
    INSERT INTO performance_metrics (
        organization_id,
        module,
        operation,
        environment,
        duration,
        memory_usage,
        cpu_usage,
        error_count,
        user_count
    ) VALUES (
        p_organization_id,
        p_module,
        p_operation,
        p_environment,
        p_duration,
        p_memory_usage,
        p_cpu_usage,
        p_error_count,
        p_user_count
    ) RETURNING id INTO v_metric_id;

    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for test cases
CREATE POLICY "Test cases are viewable by organization members" ON test_cases
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            test_cases.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Test cases can be managed by admins and QA" ON test_cases
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'qa')
                AND (users.organization_id = test_cases.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for test runs
CREATE POLICY "Test runs are viewable by organization members" ON test_runs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            test_runs.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Test runs can be managed by admins and QA" ON test_runs
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin', 'qa')
                AND (users.organization_id = test_runs.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for performance metrics
CREATE POLICY "Performance metrics are viewable by organization members" ON performance_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            performance_metrics.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create materialized view for test metrics
CREATE MATERIALIZED VIEW test_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', created_at) as date,
    module,
    type,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tests,
    COUNT(CASE WHEN status = 'deprecated' THEN 1 END) as deprecated_tests
FROM test_cases
GROUP BY organization_id, DATE_TRUNC('day', created_at), module, type;

CREATE MATERIALIZED VIEW test_run_metrics AS
SELECT
    organization_id,
    DATE_TRUNC('day', started_at) as date,
    environment,
    COUNT(*) as total_runs,
    COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_runs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_runs,
    AVG(duration)::INTEGER as avg_duration_ms
FROM test_runs
GROUP BY organization_id, DATE_TRUNC('day', started_at), environment;

-- Create indexes for materialized views
CREATE INDEX idx_test_metrics_organization ON test_metrics(organization_id);
CREATE INDEX idx_test_metrics_date ON test_metrics(date);
CREATE INDEX idx_test_run_metrics_organization ON test_run_metrics(organization_id);
CREATE INDEX idx_test_run_metrics_date ON test_run_metrics(date);

-- Enable RLS on materialized views
ALTER MATERIALIZED VIEW test_metrics ENABLE ROW LEVEL SECURITY;
ALTER MATERIALIZED VIEW test_run_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for metrics views
CREATE POLICY "Test metrics are viewable by organization members" ON test_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Test run metrics are viewable by organization members" ON test_run_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 