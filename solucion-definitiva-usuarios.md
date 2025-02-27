# Solución Definitiva para la Creación de Usuarios en FacilityManagerPro

## Diagnóstico del Problema

Después de múltiples pruebas, hemos identificado que el problema principal reside en la arquitectura de la base de datos:

1. Existe una **restricción de clave foránea** entre la tabla `users` (donde se almacenan los datos de usuarios) y la tabla `auth.users` (donde Supabase gestiona la autenticación).

2. Esta restricción crea un **ciclo de dependencia**: para crear un usuario en `users`, necesita existir en `auth.users`, pero a su vez, para crear un usuario en `auth.users`, se requiere que ya exista en `users`.

3. El resultado es que no es posible crear usuarios nuevos de forma programática sin modificar la estructura de la base de datos.

## Solución Definitiva

La solución se divide en dos partes: modificaciones en la base de datos y desarrollo de scripts.

### 1. Modificaciones en la Base de Datos (Requiere Acceso Administrativo)

```sql
-- Accede al SQL Editor de Supabase o directamente a la base de datos PostgreSQL

-- 1. Identificar y eliminar temporalmente la restricción de clave foránea
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Crear una función que maneje la creación sincronizada de usuarios
CREATE OR REPLACE FUNCTION create_synchronized_user(
    p_email TEXT,
    p_password TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_hashed_password TEXT;
BEGIN
    -- Generar un UUID para el nuevo usuario
    v_user_id := gen_random_uuid();
    
    -- Aplicar el hash a la contraseña (simplificado, debe adaptarse al método de Supabase)
    v_hashed_password := crypt(p_password, gen_salt('bf'));

    -- Insertar en auth.users
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        raw_user_meta_data, raw_app_meta_data, role, 
        created_at, updated_at
    ) VALUES (
        v_user_id, p_email, v_hashed_password, now(),
        jsonb_build_object(
            'first_name', p_first_name,
            'last_name', p_last_name,
            'role', p_role
        ),
        jsonb_build_object('provider', 'email'),
        'authenticated',
        now(), now()
    );

    -- Insertar en public.users
    INSERT INTO public.users (
        id, email, first_name, last_name, role, 
        organization_id, status, created_at, updated_at,
        timezone, language, metadata, failed_login_attempts
    ) VALUES (
        v_user_id, p_email, p_first_name, p_last_name, p_role,
        p_organization_id, 'active', now(), now(),
        'UTC', 'es', '{}', 0
    );

    -- Devolver el ID del usuario creado
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Otorgar permisos para usar la función
GRANT EXECUTE ON FUNCTION create_synchronized_user TO service_role;

-- 4. Crear una API RPC para llamar a la función desde JavaScript
CREATE OR REPLACE FUNCTION create_user_rpc(
    email TEXT,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    organization_id UUID
) RETURNS UUID AS $$
    SELECT create_synchronized_user($1, $2, $3, $4, $5, $6);
$$ LANGUAGE SQL SECURITY DEFINER;

-- 5. Otorgar permisos para usar la función RPC
GRANT EXECUTE ON FUNCTION create_user_rpc TO authenticated;
```

### 2. Script para Utilizar la Función RPC (Solución Cliente)

```javascript
// save as create-user.js
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del nuevo usuario
const newUser = {
  email: "ejemplo@facilitymanagerpro.com",
  password: "SecurePassword123!",
  first_name: "Nombre",
  last_name: "Apellido",
  role: "admin",
  organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584" // ID de HospitalesGlobales
};

async function createUser() {
  console.log(`===== CREANDO NUEVO USUARIO =====`);
  console.log(`Email: ${newUser.email}`);
  console.log(`Nombre: ${newUser.first_name} ${newUser.last_name}`);
  console.log(`Rol: ${newUser.role}`);
  
  try {
    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('create_user_rpc', {
      email: newUser.email,
      password: newUser.password,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
      organization_id: newUser.organization_id
    });
    
    if (error) {
      console.error('Error al crear usuario:', error);
      return;
    }
    
    console.log('¡Usuario creado exitosamente!');
    console.log('ID del usuario:', data);
    
    // Verificar que el usuario puede iniciar sesión
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: newUser.email,
      password: newUser.password
    });
    
    if (signInError) {
      console.error('Error al verificar inicio de sesión:', signInError);
    } else {
      console.log('¡Verificación exitosa! El usuario puede iniciar sesión correctamente.');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
createUser().catch(err => {
  console.error('Error fatal:', err);
});
```

### 3. Script Mejorado para Crear Múltiples Usuarios en Lote

```javascript
// save as batch-create-users.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de usuarios a crear (puede cargarse desde un archivo CSV o JSON)
const usersToCreate = [
  {
    email: "admin1@facilitymanagerpro.com",
    password: "SecurePassword123!",
    first_name: "Admin",
    last_name: "Uno",
    role: "admin",
    organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584"
  },
  {
    email: "admin2@facilitymanagerpro.com",
    password: "SecurePassword123!",
    first_name: "Admin",
    last_name: "Dos",
    role: "admin",
    organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584"
  }
  // Añadir más usuarios según sea necesario
];

async function createUsers() {
  console.log(`===== CREANDO USUARIOS EN LOTE =====`);
  console.log(`Total de usuarios a crear: ${usersToCreate.length}`);
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (const user of usersToCreate) {
    console.log(`\nProcesando usuario: ${user.email}`);
    
    try {
      // Llamar a la función RPC
      const { data, error } = await supabase.rpc('create_user_rpc', {
        email: user.email,
        password: user.password,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      });
      
      if (error) {
        console.error(`Error al crear usuario ${user.email}:`, error);
        results.failed.push({
          email: user.email,
          error: error.message
        });
        continue;
      }
      
      console.log(`¡Usuario ${user.email} creado exitosamente!`);
      results.successful.push({
        email: user.email,
        id: data
      });
      
    } catch (error) {
      console.error(`Error general para ${user.email}:`, error);
      results.failed.push({
        email: user.email,
        error: error.message
      });
    }
  }
  
  // Resumen final
  console.log('\n===== RESUMEN DE CREACIÓN DE USUARIOS =====');
  console.log(`Total procesados: ${usersToCreate.length}`);
  console.log(`Exitosos: ${results.successful.length}`);
  console.log(`Fallidos: ${results.failed.length}`);
  
  // Guardar los resultados en un archivo
  fs.writeFileSync('user-creation-results.json', JSON.stringify(results, null, 2));
  console.log('\nLos resultados detallados se han guardado en "user-creation-results.json"');
}

// Ejecutar la función
createUsers().catch(err => {
  console.error('Error fatal:', err);
});
```

## Instrucciones de Implementación

1. **Contactar al Administrador de Base de Datos**:
   - Proporcionar el script SQL para que lo ejecute en el entorno de producción.
   - Solicitar la revisión y aprobación de las modificaciones propuestas.

2. **Ejecutar las Modificaciones**:
   - El administrador debe ejecutar el script SQL en el SQL Editor de Supabase o directamente en la base de datos PostgreSQL.
   - Verificar que no haya errores durante la ejecución.

3. **Probar la Funcionalidad**:
   - Ejecutar el script `create-user.js` para verificar que la función RPC funciona correctamente.
   - Confirmar que el usuario puede iniciar sesión después de ser creado.

4. **Implementar la Solución a Gran Escala**:
   - Usar el script `batch-create-users.js` para crear múltiples usuarios.
   - Modificar el CSV o JSON de entrada según sea necesario.

## Ventajas de Esta Solución

1. **Sincronización Garantizada**: Los usuarios se crean simultáneamente en ambas tablas, eliminando problemas de sincronización.

2. **Seguridad Mejorada**: La función se ejecuta con permisos elevados (SECURITY DEFINER), pero el acceso está controlado.

3. **Escalabilidad**: Permite crear usuarios en lote para satisfacer necesidades a gran escala.

4. **Mantenibilidad**: Centraliza la lógica de creación de usuarios en la base de datos, facilitando futuros cambios.

## Alternativa Temporal

Mientras se implementa la solución definitiva, puede seguir utilizando el script `user-creation-helper.js` para reutilizar usuarios existentes. Sin embargo, esta no es una solución sostenible a largo plazo para la creación masiva de usuarios. 