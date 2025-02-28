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
  email: 'nuevo.admin@facilitymanagerpro.com',
  password: 'Admin123!',
  first_name: 'Admin',
  last_name: 'Nuevo',
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

// Función para crear un usuario usando la función RPC
async function createUserWithRPC(userData) {
  try {
    console.log(`Creando usuario ${userData.email} usando RPC...`);
    
    // Generar un UUID v4 para el nuevo usuario
    const userId = crypto.randomUUID();
    
    // Llamar a la función RPC para crear el usuario
    const { data, error } = await supabase.rpc('create_user_rpc', {
      user_id: userId,
      user_email: userData.email,
      user_first_name: userData.first_name,
      user_last_name: userData.last_name,
      user_role: userData.role,
      user_organization_id: userData.organization_id,
      user_password: userData.password
    });
    
    if (error) {
      console.error(`Error al crear usuario con RPC: ${error.message}`);
      return null;
    }
    
    console.log(`Usuario creado exitosamente con ID: ${data}`);
    
    return data;
  } catch (error) {
    console.error(`Error general al crear usuario: ${error.message}`);
    return null;
  }
}

// Función principal
async function createNewAdmin() {
  console.log('===== CREANDO NUEVO USUARIO ADMINISTRADOR =====');
  
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
  
  // Crear el usuario con la función RPC
  const userId = await createUserWithRPC(adminUser);
  
  if (userId) {
    console.log('\n===== USUARIO ADMINISTRADOR CREADO EXITOSAMENTE =====');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Nombre: ${adminUser.first_name} ${adminUser.last_name}`);
    console.log(`Rol: ${adminUser.role}`);
    console.log(`ID: ${userId}`);
    console.log(`Organización: ${organizationId}`);
    console.log(`Contraseña: ${adminUser.password}`);
    console.log('\nEl usuario ahora está listo para iniciar sesión.');
    
    // Guardar resultados en un archivo
    const result = {
      id: userId,
      ...adminUser,
      created_at: new Date().toISOString()
    };
    delete result.password; // No guardar la contraseña en el archivo de resultados
    
    fs.writeFileSync('new-admin-result.json', JSON.stringify(result, null, 2));
    console.log('Resultados guardados en new-admin-result.json');
  } else {
    console.error('\n❌ No se pudo crear el usuario administrador. Revisa los errores anteriores.');
  }
}

// Ejecutar la función principal
createNewAdmin().catch(err => {
  console.error('Error fatal:', err);
}); 