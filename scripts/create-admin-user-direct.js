// Script para crear un usuario administrador usando SQL directo
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar que las credenciales estén definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Datos del usuario
const userData = {
  email: 'alejandro.echevers@hospitalesglobales.com',
  firstName: 'Alejandro',
  lastName: 'Echevers',
  role: 'admin',
  organizationId: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584',
  // Generar una contraseña aleatoria
  password: `Admin${crypto.randomBytes(4).toString('hex')}!`
};

async function createAdminUser() {
  console.log('Creando usuario administrador con los siguientes datos:');
  console.log(`- Email: ${userData.email}`);
  console.log(`- Nombre: ${userData.firstName} ${userData.lastName}`);
  console.log(`- Rol: ${userData.role}`);
  console.log(`- ID de Organización: ${userData.organizationId}`);
  console.log(`- Contraseña: ${userData.password}`);

  try {
    // Paso 1: Crear el usuario utilizando la API de autenticación de Supabase (auth.admin.createUser)
    // Este método es preferible a ejecutar SQL directo en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en auth: ${authError.message}`);
    }

    console.log(`Usuario creado en auth.users con ID: ${authUser.user.id}`);

    // Paso 2: Insertar usuario en la tabla users de la aplicación
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
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Error insertando en tabla users: ${userError.message}`);
    }

    console.log(`Usuario insertado en tabla users con ID: ${userRecord.id}`);

    // Guardar credenciales en un archivo para referencia
    const credentials = {
      id: authUser.user.id,
      email: userData.email,
      password: userData.password,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      organizationId: userData.organizationId
    };

    fs.writeFileSync(
      'scripts/admin_credentials.json',
      JSON.stringify(credentials, null, 2)
    );

    console.log(`Credenciales guardadas en scripts/admin_credentials.json`);
    console.log('¡Usuario administrador creado exitosamente!');

    return {
      success: true,
      userId: authUser.user.id
    };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar la función
createAdminUser(); 