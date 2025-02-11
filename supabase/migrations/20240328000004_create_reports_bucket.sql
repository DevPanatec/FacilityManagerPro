-- Create Reports bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Reports', 'Reports', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies for the Reports bucket
DELETE FROM storage.policies 
WHERE bucket_id = 'Reports';

-- Create new policies for the Reports bucket
DO $$
BEGIN
    -- Policy for INSERT operations
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES ('Reports', 'Allow uploads for authenticated users', jsonb_build_object(
        'role', 'authenticated',
        'resource', 'objects',
        'action', 'INSERT',
        'check', '(bucket_id = ''Reports'')'
    ));

    -- Policy for SELECT operations
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES ('Reports', 'Allow downloads for authenticated users', jsonb_build_object(
        'role', 'authenticated',
        'resource', 'objects',
        'action', 'SELECT',
        'check', '(bucket_id = ''Reports'')'
    ));

    -- Policy for UPDATE operations
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES ('Reports', 'Allow updates for authenticated users', jsonb_build_object(
        'role', 'authenticated',
        'resource', 'objects',
        'action', 'UPDATE',
        'check', '(bucket_id = ''Reports'')'
    ));

    -- Policy for DELETE operations
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES ('Reports', 'Allow deletes for authenticated users', jsonb_build_object(
        'role', 'authenticated',
        'resource', 'objects',
        'action', 'DELETE',
        'check', '(bucket_id = ''Reports'')'
    ));
END $$;

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow full access to authenticated users"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'Reports')
WITH CHECK (bucket_id = 'Reports');

-- Verify the bucket and policies were created correctly
SELECT * FROM storage.buckets WHERE id = 'Reports';
SELECT bucket_id, name, definition FROM storage.policies WHERE bucket_id = 'Reports'; 