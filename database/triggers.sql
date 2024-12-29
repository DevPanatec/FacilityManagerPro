-- Trigger para registrar cambios en tablas importantes
CREATE OR REPLACE FUNCTION log_activity() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        NEW.organization_id,
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object(
            'old_data', row_to_json(OLD),
            'new_data', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a tablas importantes
CREATE TRIGGER log_tasks_changes
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_employee_changes
    AFTER INSERT OR UPDATE OR DELETE ON employee_records
    FOR EACH ROW EXECUTE FUNCTION log_activity(); 