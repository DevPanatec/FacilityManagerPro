-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create work_shifts table if it doesn't exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'work_shifts'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create work_shifts table
        CREATE TABLE work_shifts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            organization_id UUID REFERENCES organizations(id) NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Work shifts are viewable by organization members" ON work_shifts
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = work_shifts.organization_id
                )
            );

        CREATE POLICY "Work shifts can be managed by admins and enterprise users" ON work_shifts
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = work_shifts.organization_id
                    AND users.role IN ('admin', 'enterprise')
                )
            );

        -- Create indexes
        CREATE INDEX work_shifts_organization_id_idx ON work_shifts(organization_id);

        -- Add trigger for updated_at
        CREATE TRIGGER update_work_shifts_updated_at
            BEFORE UPDATE ON work_shifts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create employees table if it doesn't exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'employees'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create employees table
        CREATE TABLE employees (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = employees.organization_id
                )
            );

        CREATE POLICY "Employees can be managed by admins and enterprise users" ON employees
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = employees.organization_id
                    AND users.role IN ('admin', 'enterprise')
                )
            );

        -- Create indexes
        CREATE INDEX employees_organization_id_idx ON employees(organization_id);
        CREATE INDEX employees_user_id_idx ON employees(user_id);
        CREATE INDEX employees_work_shift_id_idx ON employees(work_shift_id);
        CREATE INDEX employees_status_idx ON employees(status);

        -- Add trigger for updated_at
        CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 