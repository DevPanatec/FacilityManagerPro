-- Política para exportar datos
CREATE POLICY "Users can export organization data"
ON organizations FOR SELECT
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM user_organizations 
        WHERE org_id = id
    )
); 