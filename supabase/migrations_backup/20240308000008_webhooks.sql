-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    events TEXT[] NOT NULL,
    headers JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    secret TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    request_body JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    duration INTEGER, -- in milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook retries table
CREATE TABLE IF NOT EXISTS webhook_retries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    log_id UUID NOT NULL REFERENCES webhook_logs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    duration INTEGER, -- in milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_retries ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_webhooks_organization ON webhooks(organization_id);
CREATE INDEX idx_webhooks_created_by ON webhooks(created_by);
CREATE INDEX idx_webhook_logs_organization ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);
CREATE INDEX idx_webhook_retries_organization ON webhook_retries(organization_id);
CREATE INDEX idx_webhook_retries_webhook ON webhook_retries(webhook_id);
CREATE INDEX idx_webhook_retries_log ON webhook_retries(log_id);

-- Add triggers for updated_at
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_webhooks_changes
    AFTER INSERT OR UPDATE OR DELETE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create function to send webhook
CREATE OR REPLACE FUNCTION send_webhook(
    p_webhook_id UUID,
    p_event_type TEXT,
    p_payload JSONB
) RETURNS UUID AS $$
DECLARE
    v_webhook webhooks%ROWTYPE;
    v_log_id UUID;
BEGIN
    -- Get webhook configuration
    SELECT * INTO v_webhook
    FROM webhooks
    WHERE id = p_webhook_id
    AND is_active = true;

    -- If webhook not found or not active, return null
    IF v_webhook IS NULL THEN
        RETURN NULL;
    END IF;

    -- Create webhook log entry
    INSERT INTO webhook_logs (
        organization_id,
        webhook_id,
        event_type,
        request_body
    ) VALUES (
        v_webhook.organization_id,
        v_webhook.id,
        p_event_type,
        p_payload
    ) RETURNING id INTO v_log_id;

    -- Note: The actual HTTP request will be handled by an Edge Function
    -- This function just creates the log entry and returns its ID

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update webhook log
CREATE OR REPLACE FUNCTION update_webhook_log(
    p_log_id UUID,
    p_response_status INTEGER,
    p_response_body TEXT,
    p_error_message TEXT,
    p_duration INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE webhook_logs
    SET
        response_status = p_response_status,
        response_body = p_response_body,
        error_message = p_error_message,
        duration = p_duration
    WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create webhook retry
CREATE OR REPLACE FUNCTION create_webhook_retry(
    p_log_id UUID,
    p_attempt_number INTEGER,
    p_response_status INTEGER,
    p_response_body TEXT,
    p_error_message TEXT,
    p_duration INTEGER
) RETURNS UUID AS $$
DECLARE
    v_log webhook_logs%ROWTYPE;
    v_retry_id UUID;
BEGIN
    -- Get original log entry
    SELECT * INTO v_log
    FROM webhook_logs
    WHERE id = p_log_id;

    -- Create retry log entry
    INSERT INTO webhook_retries (
        organization_id,
        webhook_id,
        log_id,
        attempt_number,
        response_status,
        response_body,
        error_message,
        duration
    ) VALUES (
        v_log.organization_id,
        v_log.webhook_id,
        v_log.id,
        p_attempt_number,
        p_response_status,
        p_response_body,
        p_error_message,
        p_duration
    ) RETURNING id INTO v_retry_id;

    RETURN v_retry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for webhooks
CREATE POLICY "Webhooks are viewable by organization members" ON webhooks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            webhooks.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Webhooks can be created by admins" ON webhooks
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Webhooks can be updated by admins" ON webhooks
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = webhooks.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for webhook logs
CREATE POLICY "Webhook logs are viewable by organization members" ON webhook_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            webhook_logs.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create policies for webhook retries
CREATE POLICY "Webhook retries are viewable by organization members" ON webhook_retries
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            webhook_retries.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ); 