-- Organizations policies
CREATE POLICY "Organizations are viewable by authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Organizations are insertable by superadmins" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin'
    ));

CREATE POLICY "Organizations are updatable by organization admins" ON organizations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('superadmin', 'admin') AND users.organization_id = organizations.id)
        )
    );

-- Users policies
CREATE POLICY "Users are viewable by organization members" ON users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            users.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            ) OR 
            EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'superadmin')
        )
    );

CREATE POLICY "Users can be created by organization admins" ON users
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Users can be updated by organization admins or themselves" ON users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            users.id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Areas policies
CREATE POLICY "Areas are viewable by organization members" ON areas
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            areas.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Areas can be created by organization admins" ON areas
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Areas can be updated by organization admins" ON areas
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = areas.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Tasks policies
CREATE POLICY "Tasks are viewable by organization members" ON tasks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            tasks.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Tasks can be created by organization members" ON tasks
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Tasks can be updated by assignee or admins" ON tasks
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            tasks.assigned_to = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = tasks.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Work shifts policies
CREATE POLICY "Work shifts are viewable by organization members" ON work_shifts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            work_shifts.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Work shifts can be created by admins" ON work_shifts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Work shifts can be updated by admins" ON work_shifts
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = work_shifts.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Inventory items policies
CREATE POLICY "Inventory items are viewable by organization members" ON inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            inventory_items.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Inventory items can be created by admins" ON inventory_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Inventory items can be updated by admins" ON inventory_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = inventory_items.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Documents policies
CREATE POLICY "Documents are viewable by organization members" ON documents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            documents.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Documents can be created by organization members" ON documents
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Documents can be updated by uploader or admins" ON documents
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            documents.uploaded_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = documents.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Activity logs policies
CREATE POLICY "Activity logs are viewable by organization members" ON activity_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            activity_logs.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Activity logs can be created by authenticated users" ON activity_logs
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated' AND notifications.user_id = auth.uid());

CREATE POLICY "Notifications can be created by system" ON notifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated' AND notifications.user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.role() = 'authenticated' AND notification_preferences.user_id = auth.uid());

CREATE POLICY "Users can create their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND NEW.user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (auth.role() = 'authenticated' AND notification_preferences.user_id = auth.uid());

-- Evaluations policies
CREATE POLICY "Evaluations are viewable by involved users and admins" ON evaluations
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            evaluations.user_id = auth.uid() OR
            evaluations.evaluator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = evaluations.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Evaluations can be created by evaluators" ON evaluations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            NEW.evaluator_id = auth.uid() AND
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin', 'enterprise')
                AND (users.organization_id = NEW.organization_id OR users.role = 'superadmin')
            )
        )
    );

CREATE POLICY "Evaluations can be updated by evaluators" ON evaluations
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            evaluations.evaluator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() 
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = evaluations.organization_id OR users.role = 'superadmin')
            )
        )
    ); 