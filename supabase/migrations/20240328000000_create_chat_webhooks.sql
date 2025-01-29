-- Create chat_webhooks table
CREATE TABLE IF NOT EXISTS public.chat_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_webhook_logs table
CREATE TABLE IF NOT EXISTS public.chat_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES chat_webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chat_webhooks_room ON chat_webhooks(room_id);
CREATE INDEX idx_chat_webhook_logs_webhook ON chat_webhook_logs(webhook_id);
CREATE INDEX idx_chat_webhook_logs_created_at ON chat_webhook_logs(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_chat_webhooks_updated_at
    BEFORE UPDATE ON chat_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 