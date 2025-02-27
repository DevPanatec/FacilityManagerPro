const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del nuevo usuario
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const userData = {
  email: 'admin.rpc@facilitymanagerpro.com',
  password: 'SecurePass123!',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'RPC',
  organization_id: organizationId
};

// Función para verificar la organización
async function checkOrganization() {
  try {
    console.log(`Verificando organización con ID: ${organizationId}`);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    
    if (error) {
      console.error('Error al verificar la organización:', error);
      return false;
    }
    
    if (!data) {
      console.error('La organización no existe');
      return false;
    }
    
    console.log(`Organización encontrada: ${data.name}`);
    return true;
  } catch (error) {
    console.error('Error inesperado:', error);
    return false;
  }
}

// Función para registrar e instalar una función RPC personalizada en Supabase
// Nota: Esta función requerirá acceso a la consola SQL de Supabase para ser ejecutada manualmente
async function setupCreateUserFunction() {
  console.log('Para crear la función RPC personalizada, ejecuta el siguiente SQL en la consola de Supabase:');
  
  const createFunctionSQL = `
-- Función para crear un usuario completo (auth + tabla users)
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
  -- Crear el usuario en auth
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
  
  -- Crear el registro en la tabla users
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
  `;
  
  console.log(createFunctionSQL);
  
  console.log('\nUna vez creada la función, podrás usarla para crear usuarios administradores');
  console.log('Ejemplo de uso en SQL:');
  console.log(`SELECT create_admin_user(
  '${userData.email}', 
  '${userData.password}', 
  '${userData.role}', 
  '${userData.first_name}', 
  '${userData.last_name}', 
  '${userData.organization_id}'
);`);
  
  return true;
}

// Función para intentar llamar a la función RPC personalizada (si existiera)
async function tryCallCreateUserRPC() {
  try {
    console.log('Intentando llamar a la función RPC create_admin_user...');
    
    const { data, error } = await supabase.rpc('create_admin_user', {
      p_email: userData.email,
      p_password: userData.password,
      p_role: userData.role,
      p_first_name: userData.first_name,
      p_last_name: userData.last_name,
      p_organization_id: userData.organization_id
    });
    
    if (error) {
      console.error('Error al llamar a la función RPC:', error);
      return false;
    }
    
    console.log('¡Usuario creado exitosamente mediante función RPC!');
    console.log(data);
    return true;
  } catch (error) {
    console.error('Error al intentar llamar a la función RPC:', error);
    return false;
  }
}

// Función para verificar si podemos acceder a la tabla auth.users directamente
async function checkAuthTableAccess() {
  try {
    console.log('Verificando acceso a la tabla auth.users...');
    
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('No se pudo acceder a auth.users:', error);
      return false;
    }
    
    console.log('Acceso confirmado a auth.users');
    return true;
  } catch (error) {
    console.error('Error al verificar acceso a auth.users:', error);
    return false;
  }
}

// Función principal
async function createAdminUserWithRPC() {
  try {
    // Verificar la organización
    const organizationExists = await checkOrganization();
    if (!organizationExists) {
      return;
    }
    
    // Verificar si el usuario ya existe
    console.log(`Verificando si el usuario ${userData.email} ya existe...`);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userData.email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error al verificar si el usuario existe:', checkError);
      return;
    }
    
    if (existingUser) {
      console.log(`El usuario ${userData.email} ya existe.`);
      return;
    }
    
    // Intento 1: Verificar si tenemos acceso a auth.users directamente
    const hasAuthAccess = await checkAuthTableAccess();
    
    if (hasAuthAccess) {
      console.log('Tenemos acceso a auth.users. Podríamos utilizar SQL directo para crear el usuario.');
      // Nota: Esta funcionalidad requeriría acceso SQL que no tenemos desde Node.js
    }
    
    // Intento 2: Intentar llamar a la función RPC si existe
    const rpcSuccess = await tryCallCreateUserRPC();
    
    if (rpcSuccess) {
      console.log('Usuario creado exitosamente mediante función RPC');
      return;
    }
    
    // Si todo falla, proporcionar instrucciones para configurar la función RPC
    console.log('\nNo fue posible crear el usuario automáticamente.');
    console.log('Opciones disponibles:');
    console.log('1. Crear una función RPC personalizada en Supabase');
    console.log('2. Seguir las instrucciones manuales en "instrucciones-crear-admin.md"');
    
    // Generar el SQL para la función personalizada
    await setupCreateUserFunction();
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función principal
createAdminUserWithRPC().catch(error => {
  console.error('Error al ejecutar el script:', error);
}); 