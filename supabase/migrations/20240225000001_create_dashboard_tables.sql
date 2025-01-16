-- Create areas table
CREATE TABLE areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  area_id UUID REFERENCES areas(id),
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table
CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  area_id UUID REFERENCES areas(id),
  work_shift_id UUID REFERENCES work_shifts(id),
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  work_shift TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  hire_date DATE NOT NULL,
  role TEXT NOT NULL,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for areas
CREATE POLICY "Enable read access for authenticated users" ON areas
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON areas
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable update for authenticated users" ON areas
  FOR UPDATE USING (auth.role() IN ('admin', 'enterprise'));

-- Policies for tasks
CREATE POLICY "Enable read access for authenticated users" ON tasks
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON tasks
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable update for authenticated users" ON tasks
  FOR UPDATE USING (auth.role() IN ('admin', 'enterprise'));

-- Policies for staff
CREATE POLICY "Enable read access for authenticated users" ON staff
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON staff
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable update for authenticated users" ON staff
  FOR UPDATE USING (auth.role() IN ('admin', 'enterprise'));

-- Policies for employees
CREATE POLICY "Employees are viewable by organization members" ON employees
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      employees.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Employees can be managed by admins and enterprise users" ON employees
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin', 'enterprise')
      AND (users.organization_id = employees.organization_id OR users.role = 'superadmin')
    )
  );

-- Create indexes
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status); 