-- Drop existing policies
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Areas are viewable by organization members" ON areas;
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;
DROP POLICY IF EXISTS "Work shifts are viewable by organization members" ON work_shifts;
DROP POLICY IF EXISTS "Inventory items are viewable by organization members" ON inventory_items;
DROP POLICY IF EXISTS "Documents are viewable by organization members" ON documents;
DROP POLICY IF EXISTS "Activity logs are viewable by organization members" ON activity_logs;

-- Create new policies with superadmin global access
CREATE POLICY "Organizations are viewable by users" ON organizations
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            organizations.id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Areas are viewable by users" ON areas
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            areas.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Tasks are viewable by users" ON tasks
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            tasks.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Work shifts are viewable by users" ON work_shifts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            work_shifts.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Inventory items are viewable by users" ON inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            inventory_items.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Documents are viewable by users" ON documents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            documents.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    );

CREATE POLICY "Activity logs are viewable by users" ON activity_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'superadmin')
            OR
            activity_logs.organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        )
    ); 