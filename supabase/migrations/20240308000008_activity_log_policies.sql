-- Activity logs policies
DROP POLICY IF EXISTS "Activity logs are viewable by organization members" ON activity_logs;
DROP POLICY IF EXISTS "Activity logs can be created by authenticated users" ON activity_logs;

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