-- Create the contingency_files table
CREATE TABLE contingency_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contingency_id UUID NOT NULL REFERENCES contingencies(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'document')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE contingency_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files from their organization"
  ON contingency_files
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can upload files to their organization"
  ON contingency_files
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete files from their organization"
  ON contingency_files
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  ));

-- Create storage bucket for contingency files
INSERT INTO storage.buckets (id, name, public)
VALUES ('contingency-files', 'contingency-files', true);

-- Add storage policies
CREATE POLICY "Users can view files from their organization"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'contingency-files' AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can upload files to their organization"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'contingency-files' AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete files from their organization"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'contingency-files' AND (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM organizations
    WHERE id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  )); 