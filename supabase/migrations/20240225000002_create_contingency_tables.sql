-- Create contingency_reports table
CREATE TABLE contingency_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  area TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pendiente',
  is_contingency BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contingency_files table for storing file references
CREATE TABLE contingency_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES contingency_reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contingency_types table for storing predefined contingency types
CREATE TABLE contingency_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default contingency types
INSERT INTO contingency_types (organization_id, name) 
SELECT 
  id as organization_id,
  unnest(ARRAY[
    'Tubería rota',
    'Falla eléctrica',
    'Incendio',
    'Inundación',
    'Fuga de gas',
    'Accidente laboral',
    'Falla de equipos',
    'Otro'
  ]) as name
FROM organizations;

-- Enable RLS
ALTER TABLE contingency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contingency_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE contingency_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Contingency reports are viewable by organization members" ON contingency_reports
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = contingency_reports.organization_id
    )
  );

CREATE POLICY "Contingency reports can be managed by admins and enterprise users" ON contingency_reports
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = contingency_reports.organization_id
      AND role IN ('admin', 'enterprise')
    )
  );

CREATE POLICY "Contingency files are viewable by organization members" ON contingency_files
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = (
        SELECT organization_id FROM contingency_reports 
        WHERE id = contingency_files.report_id
      )
    )
  );

CREATE POLICY "Contingency files can be managed by admins and enterprise users" ON contingency_files
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = (
        SELECT organization_id FROM contingency_reports 
        WHERE id = contingency_files.report_id
      )
      AND role IN ('admin', 'enterprise')
    )
  );

CREATE POLICY "Contingency types are viewable by organization members" ON contingency_types
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = contingency_types.organization_id
    )
  );

CREATE POLICY "Contingency types can be managed by admins" ON contingency_types
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = contingency_types.organization_id
      AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX contingency_reports_organization_id_idx ON contingency_reports(organization_id);
CREATE INDEX contingency_reports_date_idx ON contingency_reports(date);
CREATE INDEX contingency_reports_status_idx ON contingency_reports(status);
CREATE INDEX contingency_files_report_id_idx ON contingency_files(report_id);
CREATE INDEX contingency_types_organization_id_idx ON contingency_types(organization_id); 