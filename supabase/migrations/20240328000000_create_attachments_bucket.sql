-- Create the Attachments bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'Attachments',
        'Attachments',
        true,
        null, -- Remove size limit
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

    RAISE NOTICE 'Bucket configuration updated successfully';
END $$;

-- Create or replace storage policies
DO $$
BEGIN
    -- Delete existing policies for this bucket
    DELETE FROM storage.policies 
    WHERE bucket_id = 'Attachments';

    RAISE NOTICE 'Existing policies deleted';

    -- Insert policies with proper JSON format
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES
    -- Upload policy for authenticated users - most permissive
    ('Attachments', 
     'upload_policy', 
     '{"condition": "true"}'),
    
    -- Read policy for everyone
    ('Attachments', 
     'read_policy', 
     '{"condition": "true"}'),
    
    -- Update policy for authenticated users
    ('Attachments', 
     'update_policy', 
     '{"condition": "true"}'),
    
    -- Delete policy for authenticated users
    ('Attachments', 
     'delete_policy', 
     '{"condition": "true"}');

    RAISE NOTICE 'New policies created successfully';
END $$;

-- Verify the policies were created correctly
SELECT bucket_id, name, definition FROM storage.policies WHERE bucket_id = 'Attachments';

-- Update Reports bucket configuration
DO $$
BEGIN
    -- Update the Reports bucket configuration
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'Reports',
        'Reports',
        true,
        null, -- Remove size limit
        ARRAY[
            'application/pdf',
            'application/json',
            'text/csv',
            'application/vnd.ms-excel',
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

    RAISE NOTICE 'Reports bucket updated';

    -- Delete existing policies for Reports bucket
    DELETE FROM storage.policies 
    WHERE bucket_id = 'Reports';

    -- Create new policies with proper JSON format for Reports bucket
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES
    -- Upload policy for authenticated users
    ('Reports', 
     'upload_policy', 
     'role = ''authenticated''::text'),
    
    -- Read policy for everyone
    ('Reports', 
     'read_policy', 
     'true'),
    
    -- Update policy for authenticated users
    ('Reports', 
     'update_policy', 
     'role = ''authenticated''::text'),
    
    -- Delete policy for authenticated users
    ('Reports', 
     'delete_policy', 
     'role = ''authenticated''::text');

    RAISE NOTICE 'Reports policies updated';
END $$;

-- Verify the policies were created correctly
SELECT bucket_id, name, definition FROM storage.policies WHERE bucket_id = 'Reports';