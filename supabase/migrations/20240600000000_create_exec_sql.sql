-- Función que permite ejecutar SQL dinámico
CREATE OR REPLACE FUNCTION exec_sql(query text, params jsonb DEFAULT '{}'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Dar permisos a authenticated
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO anon;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role; 