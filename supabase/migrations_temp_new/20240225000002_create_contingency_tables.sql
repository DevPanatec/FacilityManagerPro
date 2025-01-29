-- Skip creating contingency_reports table if it already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_reports') THEN
        -- Create contingency_reports table
        CREATE TABLE contingency_reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    END IF;
END $$;

-- Skip creating contingency_files table if it already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_files') THEN
        -- Create contingency_files table for storing file references
        CREATE TABLE contingency_files (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            report_id UUID REFERENCES contingency_reports(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Skip creating contingency_types table if it already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_types') THEN
        -- Create contingency_types table for storing predefined contingency types
        CREATE TABLE contingency_types (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    END IF;
END $$;

-- Skip RLS if already enabled
DO $$ 
BEGIN
    -- Enable RLS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_reports') AND 
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_reports' AND rowsecurity) THEN
        ALTER TABLE contingency_reports ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_files') AND 
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_files' AND rowsecurity) THEN
        ALTER TABLE contingency_files ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_types') AND 
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contingency_types' AND rowsecurity) THEN
        ALTER TABLE contingency_types ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Skip policy creation if they already exist
DO $$ 
BEGIN
    -- Create policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency reports are viewable by organization members' AND tablename = 'contingency_reports') THEN
        CREATE POLICY "Contingency reports are viewable by organization members" ON contingency_reports
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = contingency_reports.organization_id
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency reports can be managed by admins and enterprise users' AND tablename = 'contingency_reports') THEN
        CREATE POLICY "Contingency reports can be managed by admins and enterprise users" ON contingency_reports
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = contingency_reports.organization_id
                    AND users.role IN ('admin', 'enterprise')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency files are viewable by organization members' AND tablename = 'contingency_files') THEN
        CREATE POLICY "Contingency files are viewable by organization members" ON contingency_files
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM contingency_reports cr
                    JOIN users u ON u.organization_id = cr.organization_id
                    WHERE cr.id = contingency_files.report_id
                    AND u.id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency files can be managed by admins and enterprise users' AND tablename = 'contingency_files') THEN
        CREATE POLICY "Contingency files can be managed by admins and enterprise users" ON contingency_files
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM contingency_reports cr
                    JOIN users u ON u.organization_id = cr.organization_id
                    WHERE cr.id = contingency_files.report_id
                    AND u.id = auth.uid()
                    AND u.role IN ('admin', 'enterprise')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency types are viewable by organization members' AND tablename = 'contingency_types') THEN
        CREATE POLICY "Contingency types are viewable by organization members" ON contingency_types
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = contingency_types.organization_id
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contingency types can be managed by admins' AND tablename = 'contingency_types') THEN
        CREATE POLICY "Contingency types can be managed by admins" ON contingency_types
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid()
                    AND users.organization_id = contingency_types.organization_id
                    AND users.role = 'admin'
                )
            );
    END IF;
END $$;

-- Skip index creation if they already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contingency_reports_organization_id_idx') THEN
        CREATE INDEX contingency_reports_organization_id_idx ON contingency_reports(organization_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contingency_reports_date_idx') THEN
        CREATE INDEX contingency_reports_date_idx ON contingency_reports(date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contingency_reports_status_idx') THEN
        CREATE INDEX contingency_reports_status_idx ON contingency_reports(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contingency_files_report_id_idx') THEN
        CREATE INDEX contingency_files_report_id_idx ON contingency_files(report_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'contingency_types_organization_id_idx') THEN
        CREATE INDEX contingency_types_organization_id_idx ON contingency_types(organization_id);
    END IF;
END $$; 