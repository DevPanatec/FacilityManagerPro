-- Eliminar la función si existe
DROP FUNCTION IF EXISTS public.get_user_data;

-- Crear la función
CREATE OR REPLACE FUNCTION public.get_user_data(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  status text,
  first_name text,
  last_name text,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.first_name,
    u.last_name,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = user_id;
END;
$$; 