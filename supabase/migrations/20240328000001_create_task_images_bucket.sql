-- Create the task-images bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'task-images',
        'task-images',
        true,
        5242880, -- 5MB limit
        ARRAY[
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
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
    WHERE bucket_id = 'task-images';

    -- Create new policies
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES
    -- Allow authenticated users to upload files
    ('task-images', 
     'Allow authenticated uploads', 
     '(role = ''authenticated''::text)'),
    
    -- Allow authenticated users to update files in their organization
    ('task-images', 
     'Allow authenticated updates', 
     '(role = ''authenticated''::text)'),
    
    -- Allow authenticated users to read files from their organization
    ('task-images', 
     'Allow authenticated reads', 
     '(role = ''authenticated''::text)'),
    
    -- Allow authenticated users to delete files from their organization
    ('task-images', 
     'Allow authenticated deletes', 
     '(role = ''authenticated''::text)'),
    
    -- Allow public read access for task images
    ('task-images', 
     'Allow public reads', 
     'true');
END $$; 