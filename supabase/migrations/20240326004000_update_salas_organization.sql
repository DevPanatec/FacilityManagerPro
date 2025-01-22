-- Actualizar las salas existentes con el organization_id del Hospital Solano
UPDATE public.salas
SET organization_id = '3bd90128-4453-4b75-9861-9c4a6f270dfa'
WHERE organization_id IS NULL;

-- Verificar que todas las salas tengan organization_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.salas WHERE organization_id IS NULL) THEN
        RAISE EXCEPTION 'Hay salas sin organization_id';
    END IF;
END $$;

-- Asegurarse de que el estado sea true para todas las salas
UPDATE public.salas
SET estado = true
WHERE estado IS NULL; 