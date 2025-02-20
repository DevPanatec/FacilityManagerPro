-- Create inventory table
CREATE TABLE inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_stock INTEGER NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory usage history table
CREATE TABLE inventory_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id),
  quantity INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory restock history table
CREATE TABLE inventory_restock (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id),
  quantity INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule table
CREATE TABLE schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  area_id UUID REFERENCES areas(id),
  assigned_to UUID[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_restock ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Policies for inventory
CREATE POLICY "Enable read access for authenticated users" ON inventory
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON inventory
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable update for authenticated users" ON inventory
  FOR UPDATE USING (auth.role() IN ('admin', 'enterprise'));

-- Similar policies for other tables
CREATE POLICY "Enable read access for authenticated users" ON inventory_usage
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON inventory_usage
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable read access for authenticated users" ON inventory_restock
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON inventory_restock
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable read access for authenticated users" ON schedule
  FOR SELECT USING (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable insert for authenticated users" ON schedule
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'enterprise'));

CREATE POLICY "Enable update for authenticated users" ON schedule
  FOR UPDATE USING (auth.role() IN ('admin', 'enterprise')); 