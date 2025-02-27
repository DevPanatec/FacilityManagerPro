-- Creación de usuario administrador para "Alejandro Echevers" asociado a "HospitalesGlobales"
-- NOTA IMPORTANTE: Este script debe ejecutarse desde el editor SQL de Supabase

-- Versión con transacción PL/pgSQL
DO $$
DECLARE
  new_user_id UUID;
  org_id UUID := '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'; -- ID de "HospitalesGlobales"
BEGIN
  -- Insertar en auth.users
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    created_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password
  ) VALUES (
    'alejandro.echevers@hospitalesglobales.com',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"firstName":"Alejandro","lastName":"Echevers"}',
    false,
    crypt('TemporalPassword123', gen_salt('bf'))
  )
  RETURNING id INTO new_user_id;
  
  -- Insertar en la tabla users
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    organization_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'alejandro.echevers@hospitalesglobales.com',
    'Alejandro',
    'Echevers',
    'admin',
    org_id,
    'active',
    now(),
    now()
  );
  
  -- Registrar en logs
  RAISE NOTICE 'Usuario administrador creado con ID: %', new_user_id;
  RAISE NOTICE 'Email: alejandro.echevers@hospitalesglobales.com';
  RAISE NOTICE 'Organización: HospitalesGlobales (ID: %)', org_id;
END
$$; 