-- Listar todas las organizaciones con sus detalles
SELECT 
    id,
    name,
    description,
    status,
    created_at
FROM public.organizations
ORDER BY name; 