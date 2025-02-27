# Instrucciones para crear un usuario administrador en Supabase

Debido a las restricciones de clave foránea en las tablas de usuarios de Supabase, la creación automatizada de usuarios administrativos no siempre es posible a través de la API normal. Este documento proporciona instrucciones paso a paso para crear un usuario administrador mediante métodos directos en la consola de Supabase.

## Método 1: Utilizando la consola de SQL en Supabase

1. Inicia sesión en tu panel de control de Supabase.
2. Navega a la sección "SQL Editor" en el menú izquierdo.
3. Crea una nueva consulta y copia el siguiente código (ajusta los valores según sea necesario):

```sql
-- Primero, creamos una función SQL que facilita la creación de usuarios completos
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_organization_id UUID
) RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_result json;
BEGIN
  -- Crear el usuario en auth.users (sistema de autenticación)
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    role,
    created_at,
    updated_at
  )
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    'authenticated',
    now(),
    now()
  )
  RETURNING id INTO v_user_id;
  
  -- Crear el registro en public.users (tabla de la aplicación)
  INSERT INTO public.users (
    id,
    email,
    role,
    first_name,
    last_name,
    organization_id,
    status,
    created_at,
    updated_at,
    timezone,
    language,
    metadata,
    failed_login_attempts
  ) VALUES (
    v_user_id,
    p_email,
    p_role,
    p_first_name,
    p_last_name,
    p_organization_id,
    'active',
    now(),
    now(),
    'UTC',
    'es',
    '{}',
    0
  );
  
  SELECT json_build_object(
    'id', v_user_id,
    'email', p_email,
    'role', p_role,
    'organization_id', p_organization_id
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

4. Ejecuta la consulta para crear la función.
5. Ahora, crea una nueva consulta y ejecuta lo siguiente para crear tu usuario administrador (ajusta los valores):

```sql
SELECT create_admin_user(
  'admin@facilitymanagerpro.com', -- Email 
  'SecurePass123!',              -- Contraseña
  'admin',                       -- Rol (admin)
  'Admin',                       -- Nombre
  'Principal',                   -- Apellido
  '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'  -- ID de la organización
);
```

6. Verifica que el usuario se haya creado correctamente consultando:

```sql
SELECT * FROM public.users WHERE email = 'admin@facilitymanagerpro.com';
```

## Método 2: Utilizando la interfaz de Supabase y SQL

### Paso 1: Crear el usuario en Authentication

1. En el panel de Supabase, ve a la sección "Authentication" > "Users".
2. Haz clic en "Invite user" (Invitar usuario).
3. Introduce la dirección de correo electrónico del administrador y haz clic en "Invite".
4. Esto enviará un correo electrónico con un enlace para establecer la contraseña.

### Paso 2: Obtener el ID del usuario creado

1. Una vez que el usuario haya establecido su contraseña y se haya registrado, ve a "Authentication" > "Users".
2. Busca el usuario recién creado y toma nota de su UUID.

### Paso 3: Agregar el registro a la tabla users con el rol de admin

1. Ve a "SQL Editor".
2. Crea una nueva consulta y ejecuta:

```sql
INSERT INTO public.users (
  id,
  email,
  role,
  first_name,
  last_name,
  organization_id,
  status,
  created_at,
  updated_at,
  timezone,
  language,
  metadata,
  failed_login_attempts
) VALUES (
  'UUID-DEL-USUARIO-OBTENIDO-EN-EL-PASO-2',
  'admin@facilitymanagerpro.com',
  'admin',
  'Admin',
  'Principal',
  '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
  'active',
  now(),
  now(),
  'UTC',
  'es',
  '{}',
  0
);
```

## Método 3: Utilizando Edge Functions de Supabase (avanzado)

Si necesitas una solución más avanzada y programática, puedes crear una Edge Function en Supabase que se encargue de la creación de usuarios administrativos con manejo apropiado de errores y permisos.

1. Configura y despliega una Edge Function siguiendo la documentación oficial de Supabase.
2. Implementa la lógica de creación de usuario con acceso al Service Role API.

## Solución de problemas comunes

### Error de clave foránea (foreign key constraint)

Si encuentras un error como "violates foreign key constraint", esto generalmente significa que estás intentando insertar un registro en `public.users` con un ID que no existe en `auth.users`. Asegúrate de seguir los pasos en el orden correcto.

### Error de duplicado (duplicate key value)

Si encuentras un error de clave duplicada, esto significa que ya existe un usuario con el mismo email o ID. Puedes verificar si el usuario ya existe y actualizar sus datos en lugar de insertar un nuevo registro. 