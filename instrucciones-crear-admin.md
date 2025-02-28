# Instrucciones para crear manualmente un usuario administrador en Supabase

Debido a las restricciones en la configuración actual de Supabase, es necesario seguir estos pasos para crear un nuevo usuario administrador asociado a la organización HospitalesGlobales.

## Paso 1: Acceder al panel de Supabase

1. Accede al panel de administración de Supabase: https://app.supabase.io
2. Selecciona el proyecto de Facility Manager Pro
3. Ve a la sección "Authentication" en el menú lateral

## Paso 2: Crear el usuario en Auth

1. En la sección "Authentication", haz clic en "Users"
2. Haz clic en el botón "Add User" o "New User"
3. Ingresa los siguientes datos:
   - Email: admin.hospital@facilitymanagerpro.com
   - Password: Admin123!
   - (Marca la opción "Auto-confirm user" si está disponible)
4. Guarda el UUID generado para el usuario, lo necesitarás más adelante

## Paso 3: Agregar el usuario a la tabla public.users

1. Ve a la sección "Table Editor" en el menú lateral
2. Selecciona la tabla "users" del esquema "public"
3. Haz clic en "Insert" o "New Row"
4. Ingresa los siguientes datos:
   - id: (Usa el UUID generado en el paso anterior)
   - email: admin.hospital@facilitymanagerpro.com
   - first_name: Admin
   - last_name: Hospital
   - role: admin
   - organization_id: 0d7f71d0-1b5f-473f-a3d5-68c3abf99584
   - status: active
   - created_at: (Usa la función `now()`)
   - updated_at: (Usa la función `now()`)
5. Guarda los cambios

## Paso 4: Actualizar el usuario en Auth con metadatos

1. Ve a la sección "SQL Editor" en el menú lateral
2. Abre un nuevo script o consulta
3. Copia el siguiente SQL y reemplaza `[USER_UUID]` con el UUID del usuario:

```sql
UPDATE auth.users SET
  raw_user_meta_data = jsonb_build_object(
    'first_name', 'Admin',
    'last_name', 'Hospital',
    'email_verified', true,
    'phone_verified', true,
    'verified', true,
    'complete_profile', true
  ),
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email']::text[],
    'role', 'admin'
  ),
  role = 'authenticated',
  email_confirmed_at = NOW()
WHERE id = '[USER_UUID]';
```

4. Ejecuta el script SQL

## Paso 5: Verificar la creación del usuario

1. Ve a la sección "Authentication" > "Users" y verifica que el usuario esté listado
2. Ve a la sección "Table Editor" > "public.users" y verifica que el usuario esté listado
3. Confirma que los datos son correctos en ambas tablas

## Paso 6: Prueba de inicio de sesión

1. Intenta iniciar sesión en la aplicación usando:
   - Email: admin.hospital@facilitymanagerpro.com
   - Password: Admin123!
2. Verifica que puedas acceder con privilegios de administrador y que estés asociado a la organización correcta

## Solución a largo plazo

Para automatizar este proceso y evitar problemas en el futuro, te recomendamos:

1. Ejecutar el script SQL "crear-funcion-rpc.sql" en el SQL Editor de Supabase para crear una función RPC que maneje ambas inserciones de manera atómica
2. Usar el script "prueba-rpc-admin.js" para probar la función RPC después de crearla
3. Integrar esta función en tu aplicación para manejar la creación de usuarios de manera más robusta

## Contacto

Si encuentras problemas durante este proceso, contacta al administrador del sistema o al equipo de desarrollo. 