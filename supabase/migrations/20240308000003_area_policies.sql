-- Areas policies
DROP POLICY IF EXISTS "Areas are viewable by organization members" ON areas;
DROP POLICY IF EXISTS "Areas can be created by organization admins" ON areas;
DROP POLICY IF EXISTS "Areas can be updated by organization admins" ON areas;

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
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role IN ('superadmin', 'admin', 'enterprise')
            AND (admin_user.organization_id = areas.organization_id OR admin_user.role = 'superadmin')
        )
    );

CREATE POLICY "Areas can be updated by organization admins" ON areas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role IN ('superadmin', 'admin', 'enterprise')
            AND (admin_user.organization_id = areas.organization_id OR admin_user.role = 'superadmin')
        )
    ); 