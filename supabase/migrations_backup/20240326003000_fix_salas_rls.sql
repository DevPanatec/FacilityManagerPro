-- Habilitar RLS en la tabla salas si no está habilitado
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para empezar desde cero
DROP POLICY IF EXISTS "Usuarios pueden ver salas de su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden crear salas en su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar salas de su organización" ON public.salas;
DROP POLICY IF EXISTS "Usuarios pueden eliminar salas de su organización" ON public.salas;

-- Crear política para SELECT
CREATE POLICY "Usuarios pueden ver salas de su organización"
ON public.salas
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid()
        AND users.organization_id = salas.organization_id
    )
);

-- Crear política para INSERT
CREATE POLICY "Usuarios pueden crear salas en su organización"
ON public.salas
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid()
        AND users.organization_id = organization_id
        AND users.role IN ('admin', 'superadmin')
    )
);

-- Crear política para UPDATE
CREATE POLICY "Usuarios pueden actualizar salas de su organización"
ON public.salas
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid()
        AND users.organization_id = salas.organization_id
        AND users.role IN ('admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid()
        AND users.organization_id = organization_id
        AND users.role IN ('admin', 'superadmin')
    )
);

-- Crear política para DELETE
CREATE POLICY "Usuarios pueden eliminar salas de su organización"
ON public.salas
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid()
        AND users.organization_id = salas.organization_id
        AND users.role IN ('admin', 'superadmin')
    )
); 