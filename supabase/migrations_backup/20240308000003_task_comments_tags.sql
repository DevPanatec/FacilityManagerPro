-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Create task_tags junction table
CREATE TABLE IF NOT EXISTS task_tags (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (task_id, tag_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_tags_organization ON tags(organization_id);
CREATE INDEX idx_task_tags_task ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);
CREATE INDEX idx_comments_organization ON comments(organization_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add activity log triggers
CREATE TRIGGER log_tags_changes
    AFTER INSERT OR UPDATE OR DELETE ON tags
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_task_tags_changes
    AFTER INSERT OR UPDATE OR DELETE ON task_tags
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER log_comments_changes
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION create_activity_log();

-- Create notification trigger for comments
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_task_title TEXT;
    v_commenter_name TEXT;
BEGIN
    -- Get task title
    SELECT title INTO v_task_title
    FROM tasks
    WHERE id = NEW.task_id;

    -- Get commenter name
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO v_commenter_name
    FROM users
    WHERE id = NEW.user_id;

    -- Notify task assignee and creator
    INSERT INTO notifications (
        organization_id,
        user_id,
        title,
        message,
        type
    )
    SELECT DISTINCT
        NEW.organization_id,
        u.id,
        'Nuevo comentario en tarea',
        v_commenter_name || ' comentó en la tarea "' || v_task_title || '"',
        'task_comment'
    FROM tasks t
    JOIN users u ON u.id IN (t.assigned_to, t.created_by)
    WHERE t.id = NEW.task_id
    AND u.id != NEW.user_id;  -- Don't notify the commenter

    -- If this is a reply, also notify the parent comment author
    IF NEW.parent_id IS NOT NULL THEN
        INSERT INTO notifications (
            organization_id,
            user_id,
            title,
            message,
            type
        )
        SELECT 
            NEW.organization_id,
            c.user_id,
            'Respuesta a tu comentario',
            v_commenter_name || ' respondió a tu comentario en la tarea "' || v_task_title || '"',
            'comment_reply'
        FROM comments c
        WHERE c.id = NEW.parent_id
        AND c.user_id != NEW.user_id;  -- Don't notify if replying to own comment
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_task_comment_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_comment();

-- Create policies for tags
CREATE POLICY "Tags are viewable by organization members" ON tags
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            tags.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Tags can be created by organization members" ON tags
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Tags can be updated by organization admins" ON tags
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = tags.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create policies for task_tags
CREATE POLICY "Task tags are viewable by organization members" ON task_tags
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_tags.task_id
                AND tasks.organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Task tags can be managed by task owners and admins" ON task_tags
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_tags.task_id
                AND (
                    tasks.created_by = auth.uid() OR
                    tasks.assigned_to = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.role IN ('superadmin', 'admin', 'enterprise')
                        AND (users.organization_id = tasks.organization_id OR users.role = 'superadmin')
                    )
                )
            )
        )
    );

-- Create policies for comments
CREATE POLICY "Comments are viewable by organization members" ON comments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            comments.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Comments can be created by task participants" ON comments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = NEW.task_id
                AND (
                    tasks.created_by = auth.uid() OR
                    tasks.assigned_to = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE users.id = auth.uid()
                        AND users.organization_id = tasks.organization_id
                    )
                )
            )
        )
    );

CREATE POLICY "Comments can be updated by their authors" ON comments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            comments.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = comments.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Comments can be deleted by their authors or admins" ON comments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            comments.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = comments.organization_id OR users.role = 'superadmin')
            )
        )
    ); 