-- Create the storage bucket if it doesn't exist
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
            'application/octet-stream'
        ]::text[]
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
END $$;

-- Create or replace storage policies
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
    
    -- Allow authenticated users to read all files
    ('contingency-files', 
     'Allow authenticated reads', 
     '(role = ''authenticated''::text)'),
    
    -- Allow authenticated users to delete their own files
    ('contingency-files', 
     'Allow authenticated deletes', 
     '(role = ''authenticated''::text AND (storage.foldername(name))[1] = auth.uid()::text)'),
    
    -- Allow public read access
    ('contingency-files', 
     'Allow public reads', 
     'true');
END $$; 