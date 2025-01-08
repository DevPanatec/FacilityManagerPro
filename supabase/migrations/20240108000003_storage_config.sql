-- Create storage buckets with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('temp', 'temp', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Avatars bucket policies
CREATE POLICY "Avatar images are accessible by owner"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Documents bucket policies
CREATE POLICY "Documents are accessible by organization members"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND status = 'active'
  )
);

CREATE POLICY "Organization members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND status = 'active'
  )
);

CREATE POLICY "Organization members can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND status = 'active'
  )
);

CREATE POLICY "Organization members can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND status = 'active'
  )
);

-- Temp bucket policies
CREATE POLICY "Authenticated users can use temp bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'temp')
WITH CHECK (bucket_id = 'temp');

-- Function to clean up temp files
CREATE OR REPLACE FUNCTION storage.cleanup_temp_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'temp'
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Schedule cleanup job
SELECT cron.schedule(
  'cleanup-temp-files',
  '0 * * * *',  -- Every hour
  $$
    SELECT storage.cleanup_temp_files();
  $$
); 