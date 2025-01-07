-- Create audit log types
DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'INSERT', 'UPDATE', 'DELETE',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
        'PASSWORD_CHANGE', 'ROLE_CHANGE',
        'PERMISSION_CHANGE', 'SECURITY_EVENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action audit_action NOT NULL,
    table_name TEXT,
    record_id UUID,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    CONSTRAINT valid_ip_address CHECK (ip_address << '0.0.0.0/0' OR ip_address << '::/0')
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
    FOR SELECT TO authenticated
    USING (auth.check_user_role('superadmin'));

-- Function to record audit log
CREATE OR REPLACE FUNCTION audit.log(
    action audit_action,
    table_name TEXT,
    record_id UUID,
    old_data JSONB DEFAULT NULL,
    new_data JSONB DEFAULT NULL,
    metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    current_user_id UUID;
    current_ip INET;
    current_user_agent TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    
    -- Try to get IP and user agent from request headers
    BEGIN
        current_ip := (current_setting('request.headers')::json->>'x-forwarded-for')::inet;
    EXCEPTION WHEN OTHERS THEN
        current_ip := NULL;
    END;
    
    BEGIN
        current_user_agent := current_setting('request.headers')::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        current_user_agent := NULL;
    END;

    -- Insert audit log
    INSERT INTO audit_logs (
        action,
        table_name,
        record_id,
        user_id,
        ip_address,
        user_agent,
        old_data,
        new_data,
        metadata
    ) VALUES (
        action,
        table_name,
        record_id,
        current_user_id,
        current_ip,
        current_user_agent,
        old_data,
        new_data,
        metadata
    )
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit trigger for a table
CREATE OR REPLACE FUNCTION audit.create_audit_trigger(target_table regclass)
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name := 'audit_trigger_' || target_table::text;
    
    EXECUTE format('
        CREATE OR REPLACE FUNCTION audit.%I()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF TG_OP = ''INSERT'' THEN
                PERFORM audit.log(
                    ''INSERT''::audit_action,
                    TG_TABLE_NAME::text,
                    NEW.id,
                    NULL,
                    to_jsonb(NEW)
                );
                RETURN NEW;
            ELSIF TG_OP = ''UPDATE'' THEN
                -- Only log if data actually changed
                IF to_jsonb(NEW) != to_jsonb(OLD) THEN
                    PERFORM audit.log(
                        ''UPDATE''::audit_action,
                        TG_TABLE_NAME::text,
                        NEW.id,
                        to_jsonb(OLD),
                        to_jsonb(NEW)
                    );
                END IF;
                RETURN NEW;
            ELSIF TG_OP = ''DELETE'' THEN
                PERFORM audit.log(
                    ''DELETE''::audit_action,
                    TG_TABLE_NAME::text,
                    OLD.id,
                    to_jsonb(OLD),
                    NULL
                );
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $trigger$ LANGUAGE plpgsql SECURITY DEFINER;
    ', trigger_name);

    -- Create the trigger
    EXECUTE format('
        DROP TRIGGER IF EXISTS %I ON %s;
        CREATE TRIGGER %I
            AFTER INSERT OR UPDATE OR DELETE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION audit.%I();
    ', trigger_name, target_table, trigger_name, target_table, trigger_name);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all important tables
SELECT audit.create_audit_trigger('users');
SELECT audit.create_audit_trigger('organizations');
SELECT audit.create_audit_trigger('areas');
SELECT audit.create_audit_trigger('staff_shifts');
SELECT audit.create_audit_trigger('tasks');

-- Function to log security events
CREATE OR REPLACE FUNCTION auth.log_security_event(
    event_type TEXT,
    metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
    RETURN audit.log(
        'SECURITY_EVENT'::audit_action,
        NULL,
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'event_type', event_type,
            'metadata', metadata
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for user role changes
CREATE OR REPLACE FUNCTION auth.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role != NEW.role THEN
        PERFORM audit.log(
            'ROLE_CHANGE'::audit_action,
            'users',
            NEW.id,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role changes
CREATE TRIGGER tr_log_role_change
    AFTER UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION auth.log_role_change();

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores audit logs for security and compliance tracking';
COMMENT ON FUNCTION audit.log IS 'Records an audit log entry with current user context';
COMMENT ON FUNCTION audit.create_audit_trigger IS 'Creates an audit trigger for the specified table';
COMMENT ON FUNCTION auth.log_security_event IS 'Logs a security-related event'; 