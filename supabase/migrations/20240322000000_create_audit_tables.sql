-- Tabla principal de auditoría
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR,
    user_agent VARCHAR
);

-- Función para registrar cambios
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs;
    excluded_cols text[] = ARRAY[]::text[];
    included_cols text[];
    old_row_data jsonb;
    new_row_data jsonb;
BEGIN
    IF TG_WHEN <> 'AFTER' THEN
        RAISE EXCEPTION 'audit_trigger_function() may only run as an AFTER trigger';
    END IF;

    audit_row = ROW(
        gen_random_uuid(),      -- id
        TG_TABLE_NAME::VARCHAR, -- table_name
        NULL,                   -- record_id
        TG_OP,                 -- action
        NULL,                  -- old_data
        NULL,                  -- new_data
        current_setting('app.current_user_id', true)::UUID, -- changed_by
        NOW(),                -- changed_at
        current_setting('app.client_ip', true),    -- ip_address
        current_setting('app.user_agent', true)    -- user_agent
    );

    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        old_row_data = to_jsonb(OLD);
        audit_row.old_data = old_row_data;
        audit_row.record_id = OLD.id;
    END IF;

    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        new_row_data = to_jsonb(NEW);
        audit_row.new_data = new_row_data;
        audit_row.record_id = NEW.id;
    END IF;

    INSERT INTO audit_logs VALUES (audit_row.*);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para las tablas importantes
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER tasks_audit
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Añadir más triggers según necesites 

-- Tabla de eventos de seguridad
CREATE TABLE security_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address VARCHAR,
  user_agent VARCHAR,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de intentos de login
CREATE TABLE login_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_login_attempts_email ON login_attempts(email); 