-- Documents policies
DROP POLICY IF EXISTS "Documents are viewable by organization members" ON documents;
DROP POLICY IF EXISTS "Documents can be created by organization members" ON documents;
DROP POLICY IF EXISTS "Documents can be updated by uploader or admins" ON documents;

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