-- Consultar el ID del Hospital Solano
SELECT id, name 
FROM public.organizations 
WHERE name ILIKE '%solano%'; 