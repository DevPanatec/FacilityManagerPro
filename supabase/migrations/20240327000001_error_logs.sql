-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_error_logs_organization ON error_logs(organization_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_error_code ON error_logs(error_code);

-- Create policies
CREATE POLICY "Error logs are viewable by admins only"
    ON error_logs
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('superadmin', 'admin')
            AND (users.organization_id = error_logs.organization_id OR users.role = 'superadmin')
        )
    );

CREATE POLICY "Error logs can be inserted by any authenticated user"
    ON error_logs
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Create function to clean old logs
CREATE OR REPLACE FUNCTION clean_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete logs older than 30 days
    DELETE FROM error_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a scheduled job to clean old logs
SELECT cron.schedule(
    'clean-error-logs',  -- name of the cron job
    '0 0 * * *',        -- run at midnight every day
    $$SELECT clean_old_error_logs()$$
); 