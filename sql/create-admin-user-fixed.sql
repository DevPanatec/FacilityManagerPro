-- Creación de usuario administrador para "Alejandro Echevers" asociado a "HospitalesGlobales"
-- NOTA IMPORTANTE: Este script debe ejecutarse desde el editor SQL de Supabase

-- Estas instrucciones deben ejecutarse secuencialmente y NO como una transacción
-- debido a que insertamos en tablas del esquema auth que a menudo tienen triggers especiales

-- Paso 1: Crear entrada en auth.users
-- ADVERTENCIA: La contraseña es un placeholder y debe cambiarse a través de "Reset Password"
INSERT INTO auth.users (
  email,
  email_confirmed_at,
  created_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role, -- Usa 'authenticated' como rol en auth.users
  encrypted_password
) VALUES (
  'alejandro.echevers@hospitalesglobales.com',  -- email
  now(),                                        -- email_confirmed_at
  now(),                                        -- created_at
  '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
  '{"firstName":"Alejandro","lastName":"Echevers"}', -- raw_user_meta_data
  false,                                        -- is_super_admin
  'authenticated',                              -- role (debe ser un rol PostgreSQL válido)
  -- Contraseña de ejemplo (solo placeholder)
  crypt('TemporalPassword123', gen_salt('bf'))
)
RETURNING id;

-- Anota el ID generado por la consulta anterior, lo necesitarás para el paso 2
-- Por ejemplo: '3b06d5d1-1234-5678-abcd-ef1234567890'

-- Paso 2: Insertar en la tabla de usuarios del esquema público
-- Reemplaza 'ID_GENERADO_EN_PASO_1' con el valor devuelto por la consulta anterior
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  role,  -- Aquí sí usamos 'admin' como rol de aplicación
  organization_id,
  status,
  created_at,
  updated_at
) VALUES (
  'ID_GENERADO_EN_PASO_1',  -- Reemplazar con el ID obtenido del paso anterior
  'alejandro.echevers@hospitalesglobales.com',
  'Alejandro',
  'Echevers',
  'admin',  -- Rol de administrador en la aplicación
  '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',  -- ID de "HospitalesGlobales"
  'active',
  now(),
  now()
);

-- IMPORTANTE: Después de ejecutar este script, debes enviar un correo de "Reset Password"
-- al usuario para que establezca su contraseña permanente. 