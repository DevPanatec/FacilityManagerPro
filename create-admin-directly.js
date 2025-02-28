const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase con clave de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID de la organización específica
const organizationId = '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';

// Datos del nuevo administrador
const adminUser = {
  email: 'admin.directo@hospitalintegrado.com',
  password: 'Admin123!',
  first_name: 'Admin',
  last_name: 'Directo',
  role: 'admin', // Rol de administrador
  organization_id: organizationId // ID de organización específico
};

// Función para verificar si la organización existe
async function checkOrganization(orgId) {
  try {
    console.log(`Verificando organización con ID: ${orgId}`);
    
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', orgId)
      .single();
    
    if (error) {
      console.error(`Error al verificar organización: ${error.message}`);
      return false;
    }
    
    if (!data) {
      console.error(`No se encontró organización con ID: ${orgId}`);
      return false;
    }
    
    console.log(`Organización encontrada: ${data.name} (${data.status})`);
    return true;
  } catch (error) {
    console.error(`Error general al verificar organización: ${error.message}`);
    return false;
  }
}

// Función para verificar si el usuario ya existe
async function checkUserExists(email) {
  try {
    console.log(`Verificando si el usuario con email ${email} ya existe...`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email);
    
    if (error) {
      console.error(`Error al verificar usuario existente: ${error.message}`);
      return false;
    }
    
    const exists = data && data.length > 0;
    
    if (exists) {
      console.log(`Usuario con email ${email} ya existe. ID: ${data[0].id}`);
    } else {
      console.log(`Usuario con email ${email} no existe.`);
    }
    
    return exists;
  } catch (error) {
    console.error(`Error general al verificar usuario existente: ${error.message}`);
    return false;
  }
}

// Función para crear un usuario directamente en la tabla public.users
async function createUserDirectly(userData) {
  try {
    console.log(`Creando usuario ${userData.email} directamente en la tabla users...`);
    
    // Generar un UUID v4 para el nuevo usuario
    const userId = crypto.randomUUID();
    
    // Preparar el objeto de usuario
    const userObject = {
      id: userId,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      organization_id: userData.organization_id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insertar el usuario en la tabla users
    const { data, error } = await supabase
      .from('users')
      .insert(userObject)
      .select()
      .single();
    
    if (error) {
      console.error(`Error al crear usuario directamente: ${error.message}`);
      return null;
    }
    
    console.log(`Usuario creado exitosamente con ID: ${data.id}`);
    
    return data.id;
  } catch (error) {
    console.error(`Error general al crear usuario: ${error.message}`);
    return null;
  }
}

// Función para generar instrucciones SQL para sincronizar con auth.users
function generateSQLInstructions(userId, userData) {
  return `
-- Ejecuta el siguiente SQL en el SQL Editor de Supabase para sincronizar el usuario con auth.users:

-- 1. Insertar usuario en auth.users con la contraseña ${userData.password}
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  aud,
  role
) VALUES (
  '${userId}',
  '00000000-0000-0000-0000-000000000000',
  '${userData.email}',
  '$2a$10$fgMsRpnSPPMSNxG7GI1T1.fIkDENAQWcP/D5.UG14j5QDM.9o1M4m', -- contraseña: ${userData.password}
  NOW(),
  NOW(),
  NOW(),
  jsonb_build_object(
    'first_name', '${userData.first_name}',
    'last_name', '${userData.last_name}',
    'email_verified', true,
    'phone_verified', true,
    'verified', true,
    'complete_profile', true
  ),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email']::text[],
    'verified', true,
    'role', '${userData.role}'
  ),
  'authenticated',
  '${userData.role}'
);

-- 2. Verificar que el usuario se ha creado correctamente en auth.users
SELECT * FROM auth.users WHERE id = '${userId}';
`;
}

// Función principal
async function createNewAdmin() {
  console.log('===== CREANDO NUEVO USUARIO ADMINISTRADOR DIRECTAMENTE =====');
  
  // Verificar si la organización existe
  const orgExists = await checkOrganization(organizationId);
  if (!orgExists) {
    console.error('No se puede crear un administrador para una organización que no existe.');
    return;
  }
  
  // Verificar si el usuario ya existe
  const userExists = await checkUserExists(adminUser.email);
  if (userExists) {
    console.log('El usuario ya existe. No se puede crear un usuario duplicado.');
    return;
  }
  
  // Crear el usuario directamente en la tabla users
  const userId = await createUserDirectly(adminUser);
  
  if (userId) {
    console.log('\n===== USUARIO ADMINISTRADOR CREADO EXITOSAMENTE EN public.users =====');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Nombre: ${adminUser.first_name} ${adminUser.last_name}`);
    console.log(`Rol: ${adminUser.role}`);
    console.log(`ID: ${userId}`);
    console.log(`Organización: ${organizationId}`);
    console.log(`Contraseña: ${adminUser.password} (aún no establecida)`);
    
    // Generar instrucciones SQL para sincronizar con auth.users
    const sqlInstructions = generateSQLInstructions(userId, adminUser);
    
    // Guardar resultados y SQL en archivos
    const result = {
      id: userId,
      ...adminUser,
      created_at: new Date().toISOString()
    };
    delete result.password; // No guardar la contraseña en el archivo de resultados
    
    fs.writeFileSync('new-admin-direct-result.json', JSON.stringify(result, null, 2));
    fs.writeFileSync('sincronizar-nuevo-admin.sql', sqlInstructions);
    
    console.log('\n===== PRÓXIMOS PASOS =====');
    console.log('1. El usuario se ha creado en la tabla public.users');
    console.log('2. Ahora debes sincronizarlo con la tabla auth.users utilizando el SQL generado');
    console.log('3. Se ha creado un archivo sincronizar-nuevo-admin.sql con las instrucciones SQL necesarias');
    console.log('4. Ejecuta este SQL en el SQL Editor de Supabase para completar la creación del usuario');
    console.log('\nUna vez sincronizado, el usuario podrá iniciar sesión con:');
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Contraseña: ${adminUser.password}`);
  } else {
    console.error('\n❌ No se pudo crear el usuario administrador. Revisa los errores anteriores.');
  }
}

// Ejecutar la función principal
createNewAdmin().catch(err => {
  console.error('Error fatal:', err);
}); 