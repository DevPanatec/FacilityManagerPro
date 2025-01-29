-- Work shifts policies
DROP POLICY IF EXISTS "Work shifts are viewable by organization members" ON work_shifts;
DROP POLICY IF EXISTS "Work shifts can be created by admins" ON work_shifts;
DROP POLICY IF EXISTS "Work shifts can be updated by admins" ON work_shifts;

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