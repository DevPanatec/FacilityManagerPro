const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno específicas para el admin
dotenv.config({ path: path.resolve(__dirname, './.env.admin') });
// Cargar variables de entorno del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Inicializar cliente de Supabase con clave de servicio (para acceso administrativo)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ID de la organización especificada
const organizationId = process.env.ORGANIZATION_ID || 'e7ddbbd4-a30f-403c-b219-d9660014a799';

// Generar una contraseña segura o usar una predefinida
const securePassword = process.env.ADMIN_PASSWORD || `Admin${crypto.randomBytes(4).toString('hex')}!`;

// Datos del nuevo usuario administrador
const userData = {
  email: process.env.ADMIN_EMAIL || 'nuevo.admin@ejemplo.com',
  password: securePassword,
  firstName: process.env.ADMIN_FIRST_NAME || 'Nuevo',
  lastName: process.env.ADMIN_LAST_NAME || 'Administrador',
  role: 'admin',
  organizationId: organizationId
};

// Mostrar banner de inicio
console.log('\n=================================================');
console.log('  CREACIÓN DE USUARIO ADMINISTRADOR EN SUPABASE');
console.log('=================================================\n');

async function createAdminUser() {
  console.log('Creando usuario administrador con los siguientes datos:');
  console.log(`- Email: ${userData.email}`);
  console.log(`- Nombre: ${userData.firstName} ${userData.lastName}`);
  console.log(`- Rol: ${userData.role}`);
  console.log(`- ID de Organización: ${userData.organizationId}`);
  console.log(`- Contraseña: ${userData.password}`);

  try {
    // 1. Verificar si la organización existe
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData) {
      throw new Error(`La organización con ID ${organizationId} no existe: ${orgError?.message || 'No encontrada'}`);
    }

    console.log(`\nOrganización verificada: ${orgData.name} (${orgData.id})`);

    // 2. Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role
      }
    });

    if (authError || !authUser?.user) {
      throw new Error(`Error creando usuario en auth: ${authError?.message || 'Error desconocido'}`);
    }

    console.log(`\nUsuario creado en auth.users con ID: ${authUser.user.id}`);

    // 3. Crear registro en la tabla users
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        organization_id: userData.organizationId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      // Si falla la creación del usuario, eliminar el registro de auth
      console.error(`Error insertando en tabla users: ${userError.message}`);
      console.log('Eliminando usuario auth fallido...');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id);
      if (deleteError) {
        console.error(`Error eliminando usuario auth fallido: ${deleteError.message}`);
      } else {
        console.log('Usuario auth eliminado correctamente');
      }
      
      throw new Error(`Error insertando en tabla users: ${userError.message}`);
    }

    console.log(`\nUsuario insertado en tabla users con ID: ${userRecord.id}`);

    // 4. Guardar credenciales en un archivo para referencia
    const credentials = {
      id: authUser.user.id,
      email: userData.email,
      password: userData.password,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      organizationId: userData.organizationId,
      organizationName: orgData.name
    };

    const credentialsFilePath = path.resolve(__dirname, 'new_admin_credentials.json');
    fs.writeFileSync(
      credentialsFilePath,
      JSON.stringify(credentials, null, 2)
    );

    console.log(`\nCredenciales guardadas en: ${credentialsFilePath}`);
    console.log('\n=================================================');
    console.log('  RESUMEN DEL USUARIO CREADO');
    console.log('=================================================');
    console.log(`ID: ${authUser.user.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Contraseña: ${userData.password}`);
    console.log(`Nombre completo: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`Organización: ${orgData.name} (${userData.organizationId})`);
    console.log('=================================================');
    console.log('\nProceso completado exitosamente.');

    return authUser.user;
  } catch (error) {
    console.error('\nError en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Ejecutar el proceso de creación de usuario
createAdminUser()
  .catch((error) => {
    console.error('\nError creando el usuario administrador:', error.message);
    process.exit(1);
  }); 