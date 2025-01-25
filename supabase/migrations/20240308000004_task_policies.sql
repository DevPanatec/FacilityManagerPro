-- Tasks policies
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;
DROP POLICY IF EXISTS "Tasks can be created by organization members" ON tasks;
DROP POLICY IF EXISTS "Tasks can be updated by assignee or admins" ON tasks;

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
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.organization_id = tasks.organization_id
        )
    );

CREATE POLICY "Tasks can be updated by assignee or admins" ON tasks
    FOR UPDATE USING (
        tasks.assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role IN ('superadmin', 'admin', 'enterprise')
            AND (admin_user.organization_id = tasks.organization_id OR admin_user.role = 'superadmin')
        )
    ); 