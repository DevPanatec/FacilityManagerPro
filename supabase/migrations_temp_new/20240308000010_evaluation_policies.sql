-- Evaluations policies
DROP POLICY IF EXISTS "Evaluations are viewable by involved users and admins" ON evaluations;
DROP POLICY IF EXISTS "Evaluations can be created by evaluators" ON evaluations;
DROP POLICY IF EXISTS "Evaluations can be updated by evaluators" ON evaluations;

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