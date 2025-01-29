-- Add organization_id column to salas table
ALTER TABLE public.salas
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Update existing salas to have an organization_id
-- This will set the organization_id for all existing salas to the first organization in the system
UPDATE public.salas
SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after updating existing records
ALTER TABLE public.salas
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX idx_salas_organization ON public.salas(organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Usuarios pueden ver salas de su organización" ON public.salas;
CREATE POLICY "Usuarios pueden ver salas de su organización"
ON public.salas
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = salas.organization_id
    )
);

DROP POLICY IF EXISTS "Usuarios pueden crear salas en su organización" ON public.salas;
CREATE POLICY "Usuarios pueden crear salas en su organización"
ON public.salas
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = organization_id
        AND role IN ('admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar salas de su organización" ON public.salas;
CREATE POLICY "Usuarios pueden actualizar salas de su organización"
ON public.salas
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = salas.organization_id
        AND role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = organization_id
        AND role IN ('admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar salas de su organización" ON public.salas;
CREATE POLICY "Usuarios pueden eliminar salas de su organización"
ON public.salas
FOR DELETE
USING (
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE organization_id = salas.organization_id
        AND role IN ('admin', 'superadmin')
    )
); 