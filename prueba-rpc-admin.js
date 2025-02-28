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
  email: 'admin.hospital.global@facilitymanagerpro.com',
  first_name: 'Admin',
  last_name: 'Hospital Global',
  organization_id: organizationId, // ID de organización específico
  password: 'Admin123!',
  role: 'admin' // Rol de administrador
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

// Función para crear un usuario a través de la función RPC
async function createUserRPC(userData) {
  try {
    console.log(`Creando usuario ${userData.email} a través de la función RPC...`);
    
    const { data, error } = await supabase.rpc('create_user_rpc', {
      user_email: userData.email,
      user_first_name: userData.first_name,
      user_last_name: userData.last_name,
      user_organization_id: userData.organization_id,
      user_password: userData.password,
      user_role: userData.role
    });
    
    if (error) {
      console.error(`Error al crear usuario mediante RPC: ${error.message}`);
      return null;
    }
    
    console.log(`Usuario creado exitosamente con ID: ${data}`);
    
    return data; // Este debería ser el ID del usuario
  } catch (error) {
    console.error(`Error general al crear usuario mediante RPC: ${error.message}`);
    return null;
  }
}

// Función para verificar si la función RPC existe
async function checkRPCFunction() {
  try {
    console.log('Verificando si la función RPC create_user_rpc existe...');
    
    const { data, error } = await supabase.rpc('list_database_functions');
    
    if (error) {
      console.error(`Error al verificar funciones RPC: ${error.message}`);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('No se encontraron funciones RPC');
      return false;
    }
    
    const createUserFunction = data.find(f => 
      f.function_name === 'create_user_rpc'
    );
    
    if (createUserFunction) {
      console.log('✅ La función create_user_rpc EXISTE');
      console.log('Detalles:', createUserFunction);
      return true;
    } else {
      console.log('❌ La función create_user_rpc NO EXISTE');
      return false;
    }
  } catch (error) {
    console.error(`Error general al verificar funciones RPC: ${error.message}`);
    return false;
  }
}

// Función principal
async function createAdminUserWorkaround() {
  console.log('===== CREANDO NUEVO USUARIO ADMINISTRADOR CON RPC =====');
  
  // Verificar si la función RPC existe
  const rpcExists = await checkRPCFunction();
  if (!rpcExists) {
    console.error('\n❌ Para continuar, primero debes ejecutar el script SQL que crea la función RPC.');
    console.error('Por favor, ejecuta el script "crear-funcion-rpc.sql" en el SQL Editor de Supabase.');
    return;
  }
  
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
  
  // Crear el usuario mediante la función RPC
  const userId = await createUserRPC(adminUser);
  
  if (userId) {
    console.log('\n===== USUARIO ADMINISTRADOR CREADO EXITOSAMENTE =====');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Nombre: ${adminUser.first_name} ${adminUser.last_name}`);
    console.log(`Rol: ${adminUser.role}`);
    console.log(`ID: ${userId}`);
    console.log(`Organización: ${organizationId}`);
    
    // Guardar resultados en un archivo
    const result = {
      id: userId,
      ...adminUser,
      created_at: new Date().toISOString()
    };
    delete result.password; // No guardar la contraseña en el archivo de resultados
    
    fs.writeFileSync('new-admin-rpc-result.json', JSON.stringify(result, null, 2));
    
    console.log('\n===== INFORMACIÓN DE ACCESO =====');
    console.log(`El usuario podrá iniciar sesión con:`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Contraseña: ${adminUser.password}`);
  } else {
    console.error('\n❌ No se pudo crear el usuario administrador. Revisa los errores anteriores.');
  }
}

// Ejecutar la función principal
createAdminUserWorkaround().catch(err => {
  console.error('Error fatal:', err);
}); 