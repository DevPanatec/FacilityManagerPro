-- Create a default organization if it doesn't exist
INSERT INTO public.organizations (id, name, status, created_at, updated_at)
VALUES (
    'c0a80121-d0a8-4b19-b49e-3a75d0a8c9d1',
    'Hospital Solano',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add organization_id column to salas table
ALTER TABLE public.salas
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Update existing salas to have an organization_id
UPDATE public.salas
SET organization_id = 'c0a80121-d0a8-4b19-b49e-3a75d0a8c9d1'
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after updating existing records
ALTER TABLE public.salas
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX idx_salas_organization ON public.salas(organization_id);

-- Drop all existing policies
DROP POLICY IF EXISTS "Salas are viewable by authenticated users" ON public.salas;
DROP POLICY IF EXISTS "Salas can be created by admins" ON public.salas;
DROP POLICY IF EXISTS "Salas can be updated by admins" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden ver salas de su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden crear salas en su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar salas de su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden eliminar salas de su organización" ON public.salas;

-- Create new policies
CREATE POLICY "Usuarios pueden ver salas de su organización"
ON public.salas
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = salas.organization_id
    )
);

CREATE POLICY "Usuarios pueden crear salas en su organización"
ON public.salas
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid()
        AND organization_id = organization_id
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Usuarios pueden actualizar salas de su organización"
ON public.salas
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid()
        AND organization_id = salas.organization_id
        AND role IN ('admin', 'superadmin')
    )
);

CREATE POLICY "Usuarios pueden eliminar salas de su organización"
ON public.salas
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid()
        AND organization_id = salas.organization_id
        AND role IN ('admin', 'superadmin')
    )
); 