-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modify organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo',
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Modify areas table
ALTER TABLE areas
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Modify staff_shifts table
ALTER TABLE staff_shifts
ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Activo';

-- Modify tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tipo VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP WITH TIME ZONE;

-- Create or replace view for organization summary
CREATE OR REPLACE VIEW organization_resumen AS
SELECT 
    o.id,
    o.name as nombre,
    o.logo_url,
    o.estado,
    o.ultima_actualizacion,
    COUNT(DISTINCT ss.id) as total_personal,
    COUNT(DISTINCT a.id) as total_areas,
    COUNT(DISTINCT t.id) as total_actividades
FROM organizations o
LEFT JOIN staff_shifts ss ON o.id = ss.org_id
LEFT JOIN areas a ON o.id = a.org_id
LEFT JOIN tasks t ON o.id = t.org_id
GROUP BY o.id, o.name, o.logo_url, o.estado, o.ultima_actualizacion;

-- Create functions for import/export
CREATE OR REPLACE FUNCTION import_organization_data(data JSONB)
RETURNS JSON AS $$
DECLARE
    org_id UUID;
    area_data JSONB;
    staff_data JSONB;
    task_data JSONB;
    resultado JSON;
BEGIN
    -- Start explicit transaction
    BEGIN
        -- Insert organization
        INSERT INTO organizations (
            name,
            logo_url,
            estado,
            ultima_actualizacion
        )
        SELECT 
            data->>'nombre',
            data->>'logo_url',
            COALESCE(data->>'estado', 'Activo'),
            COALESCE((data->>'ultima_actualizacion')::TIMESTAMP WITH TIME ZONE, CURRENT_TIMESTAMP)
        RETURNING id INTO org_id;

        -- Insert areas
        FOR area_data IN SELECT * FROM jsonb_array_elements(data->'areas')
        LOOP
            INSERT INTO areas (
                org_id,
                name,
                descripcion
            ) VALUES (
                org_id,
                area_data->>'nombre',
                area_data->>'descripcion'
            );
        END LOOP;

        -- Insert staff
        FOR staff_data IN SELECT * FROM jsonb_array_elements(data->'personal')
        LOOP
            INSERT INTO staff_shifts (
                org_id,
                area_id,
                cargo,
                estado
            ) VALUES (
                org_id,
                (staff_data->>'area_id')::UUID,
                staff_data->>'cargo',
                COALESCE(staff_data->>'estado', 'Activo')
            );
        END LOOP;

        -- Insert tasks
        FOR task_data IN SELECT * FROM jsonb_array_elements(data->'tasks')
        LOOP
            INSERT INTO tasks (
                org_id,
                tipo,
                fecha_inicio,
                fecha_fin
            ) VALUES (
                org_id,
                task_data->>'tipo',
                (task_data->>'fecha_inicio')::TIMESTAMP WITH TIME ZONE,
                (task_data->>'fecha_fin')::TIMESTAMP WITH TIME ZONE
            );
        END LOOP;

        SELECT json_build_object(
            'success', true,
            'organization_id', org_id,
            'message', 'Datos importados correctamente'
        ) INTO resultado;

        RETURN resultado;
    EXCEPTION WHEN OTHERS THEN
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by authenticated users"
ON organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizations are editable by organization members"
ON organizations FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT user_id 
        FROM user_organizations 
        WHERE org_id = id
    )
);

-- Add storage bucket for organization logos if needed
-- INSERT INTO storage.buckets (id, name) 
-- VALUES ('organization-logos', 'organization-logos')
-- ON CONFLICT DO NOTHING; 