-- Creación de usuario administrador para "Alejandro Echevers" asociado a "HospitalesGlobales"
-- NOTA IMPORTANTE: Este script debe ejecutarse desde el editor SQL de Supabase

-- Verificar que la extensión uuid-ossp esté disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Versión con transacción PL/pgSQL corregida para generar UUID explícito
DO $$
DECLARE
  new_user_id UUID := uuid_generate_v4(); -- Generar UUID explícitamente
  org_id UUID := '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'; -- ID de "HospitalesGlobales"
BEGIN
  -- Insertar en auth.users con ID explícito
  INSERT INTO auth.users (
    id, -- Añadir ID explícito aquí
    email,
    email_confirmed_at,
    created_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    encrypted_password
  ) VALUES (
    new_user_id, -- Usar el UUID generado
    'alejandro.echevers@hospitalesglobales.com',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"firstName":"Alejandro","lastName":"Echevers"}',
    false,
    'authenticated',
    crypt('TemporalPassword123', gen_salt('bf'))
  );
  
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
    new_user_id, -- Mismo UUID
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
  RAISE NOTICE 'Rol de aplicación: admin';
  RAISE NOTICE 'Rol PostgreSQL: authenticated';
END
$$; 