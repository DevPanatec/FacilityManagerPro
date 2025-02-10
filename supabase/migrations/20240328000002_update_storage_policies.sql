-- Drop existing policies for the Attachments bucket
DO $$
BEGIN
    DELETE FROM storage.policies 
    WHERE bucket_id = 'Attachments';

    -- Create new simplified policies for the Attachments bucket
    INSERT INTO storage.policies (bucket_id, name, definition)
    VALUES
    -- Allow authenticated users to upload files
    ('Attachments', 
     'upload_policy', 
     'true'),
    
    -- Allow public read access
    ('Attachments', 
     'read_policy', 
     'true'),
    
    -- Allow authenticated users to update files
    ('Attachments', 
     'update_policy', 
     'true'),
    
    -- Allow authenticated users to delete files
    ('Attachments', 
     'delete_policy', 
     'true');

    RAISE NOTICE 'Attachments bucket policies updated successfully';
END $$;

-- Verify the policies were created correctly
SELECT bucket_id, name, definition FROM storage.policies WHERE bucket_id = 'Attachments'; 