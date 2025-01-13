-- Crear función para obtener datos del usuario
CREATE OR REPLACE FUNCTION get_user_data(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
  FROM users u
  WHERE u.id = user_id;
END;
$$; 