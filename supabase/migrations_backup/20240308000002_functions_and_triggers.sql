-- Function to create activity log
CREATE OR REPLACE FUNCTION create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
    v_organization_id UUID;
    v_user_id UUID := auth.uid();
    v_action TEXT;
    v_entity_type TEXT;
    v_entity_id UUID;
    v_metadata JSONB;
BEGIN
    -- Determine the organization_id based on the table
    CASE TG_TABLE_NAME
        WHEN 'organizations' THEN
            v_organization_id := NEW.id;
        ELSE
            v_organization_id := NEW.organization_id;
    END CASE;

    -- Set action based on operation
    CASE TG_OP
        WHEN 'INSERT' THEN v_action := 'create';
        WHEN 'UPDATE' THEN v_action := 'update';
        WHEN 'DELETE' THEN v_action := 'delete';
    END CASE;

    -- Set entity type based on table name
    v_entity_type := TG_TABLE_NAME;
    
    -- Set entity id
    v_entity_id := NEW.id;

    -- Create metadata JSON
    v_metadata := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'new_data', to_jsonb(NEW),
        'old_data', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
    );

    -- Insert activity log
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_organization_id,
        v_user_id,
        v_action,
        v_entity_type,
        v_entity_id,
        v_metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_organization_id UUID;
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT;
BEGIN
    -- Set organization_id
    v_organization_id := NEW.organization_id;

    -- Handle different notification scenarios based on table and operation
    CASE TG_TABLE_NAME
        WHEN 'tasks' THEN
            IF TG_OP = 'INSERT' THEN
                -- Notify assigned user
                IF NEW.assigned_to IS NOT NULL THEN
                    v_user_id := NEW.assigned_to;
                    v_title := 'Nueva tarea asignada';
                    v_message := 'Se te ha asignado una nueva tarea: ' || NEW.title;
                    v_type := 'task_assigned';
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                -- Notify on status change
                IF NEW.status != OLD.status THEN
                    -- Notify task creator
                    v_user_id := NEW.created_by;
                    v_title := 'Estado de tarea actualizado';
                    v_message := 'La tarea "' || NEW.title || '" ha cambiado a estado: ' || NEW.status;
                    v_type := 'task_status_changed';
                END IF;
            END IF;

        WHEN 'work_shifts' THEN
            IF TG_OP = 'INSERT' THEN
                -- Notify assigned user
                v_user_id := NEW.user_id;
                v_title := 'Nuevo turno asignado';
                v_message := 'Se te ha asignado un nuevo turno de trabajo';
                v_type := 'shift_assigned';
            END IF;

        WHEN 'inventory_items' THEN
            IF TG_OP = 'UPDATE' THEN
                -- Notify on low stock
                IF NEW.quantity <= NEW.minimum_quantity AND OLD.quantity > OLD.minimum_quantity THEN
                    -- Notify admins (handled in a separate function)
                    PERFORM notify_admins_low_stock(NEW.organization_id, NEW.name, NEW.quantity);
                END IF;
            END IF;

        WHEN 'evaluations' THEN
            IF TG_OP = 'INSERT' THEN
                -- Notify evaluated user
                v_user_id := NEW.user_id;
                v_title := 'Nueva evaluación creada';
                v_message := 'Se ha creado una nueva evaluación para ti';
                v_type := 'evaluation_created';
            ELSIF TG_OP = 'UPDATE' THEN
                -- Notify on status change
                IF NEW.status != OLD.status THEN
                    v_user_id := NEW.user_id;
                    v_title := 'Estado de evaluación actualizado';
                    v_message := 'Tu evaluación ha cambiado a estado: ' || NEW.status;
                    v_type := 'evaluation_status_changed';
                END IF;
            END IF;
    END CASE;

    -- Insert notification if we have a user to notify
    IF v_user_id IS NOT NULL THEN
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        ) VALUES (
            v_organization_id,
            v_user_id,
            v_title,
            v_message,
            v_type
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admins about low stock
CREATE OR REPLACE FUNCTION notify_admins_low_stock(
    p_organization_id UUID,
    p_item_name TEXT,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (
        organization_id,
        user_id,
        title,
        message,
        type
    )
    SELECT 
        p_organization_id,
        users.id,
        'Stock bajo en inventario',
        'El ítem ' || p_item_name || ' tiene un stock bajo (' || p_quantity || ' unidades)',
        'low_stock'
    FROM users
    WHERE users.organization_id = p_organization_id
    AND users.role IN ('superadmin', 'admin', 'enterprise');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply activity log triggers
CREATE TRIGGER log_organizations_changes
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_areas_changes
    AFTER INSERT OR UPDATE OR DELETE ON areas
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_tasks_changes
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_work_shifts_changes
    AFTER INSERT OR UPDATE OR DELETE ON work_shifts
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_inventory_items_changes
    AFTER INSERT OR UPDATE OR DELETE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_documents_changes
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_evaluations_changes
    AFTER INSERT OR UPDATE OR DELETE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Apply notification triggers
CREATE TRIGGER notify_task_changes
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER notify_work_shift_changes
    AFTER INSERT OR UPDATE ON work_shifts
    FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER notify_inventory_changes
    AFTER INSERT OR UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION create_notification();

CREATE TRIGGER notify_evaluation_changes
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION create_notification(); 