-- Create contingency_files table
CREATE TABLE IF NOT EXISTS contingency_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contingency_id UUID NOT NULL REFERENCES contingencies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contingency_files ENABLE ROW LEVEL SECURITY;

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'contingency-files',
        'contingency-files',
        true,
        5242880, -- 5MB limit
        ARRAY[
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]::text[]
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
END $$;

-- Create policies for contingency_files table
CREATE POLICY "Files are viewable by organization members"
    ON contingency_files
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Files can be inserted by organization members"
    ON contingency_files
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Files can be deleted by creator or admin"
    ON contingency_files
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('superadmin', 'admin')
                AND (users.organization_id = contingency_files.organization_id OR users.role = 'superadmin')
            )
        )
    );

-- Create storage policies
DO $$
BEGIN
    -- Delete existing policies for this bucket
    DELETE FROM storage.policies 
    WHERE bucket_id = 'contingency-files';

    -- Create new policies
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES
    -- Allow authenticated users to upload files
    ('contingency-files', 
     'Allow authenticated uploads', 
     '(role = ''authenticated''::text)'),
    
    -- Allow authenticated users to update their own files
    ('contingency-files', 
     'Allow authenticated updates', 
     '(role = ''authenticated''::text AND (storage.foldername(name))[1] = auth.uid()::text)'),
    
    -- Allow authenticated users to read files from their organization
    ('contingency-files', 
     'Allow authenticated reads', 
     '(role = ''authenticated''::text AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM organizations WHERE id IN (
            SELECT organization_id FROM users WHERE users.id = auth.uid()
        )
     ))'),
    
    -- Allow authenticated users to delete their own files
    ('contingency-files', 
     'Allow authenticated deletes', 
     '(role = ''authenticated''::text AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN (''superadmin'', ''admin'')
        )
     ))');
END $$; 