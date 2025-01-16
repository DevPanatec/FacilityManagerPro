-- Add primary key constraint to work_shifts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'work_shifts_pkey'
    ) THEN
        ALTER TABLE work_shifts ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Create employees table
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  work_shift_id UUID REFERENCES work_shifts(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'Activo',
  hire_date DATE NOT NULL,
  role TEXT NOT NULL,
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees are viewable by organization members" ON employees
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = employees.organization_id
    )
  );

CREATE POLICY "Employees can be managed by admins and enterprise users" ON employees
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE organization_id = employees.organization_id
      AND role IN ('admin', 'enterprise')
    )
  );

-- Create indexes for better performance
CREATE INDEX employees_organization_id_idx ON employees(organization_id);
CREATE INDEX employees_user_id_idx ON employees(user_id);
CREATE INDEX employees_work_shift_id_idx ON employees(work_shift_id);
CREATE INDEX employees_status_idx ON employees(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 