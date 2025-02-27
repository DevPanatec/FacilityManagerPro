// Script para crear un usuario administrador usando el SDK de Supabase
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Cargar variables de entorno del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente de Supabase con la clave de servicio
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Generar email aleatorio para evitar conflictos
const randomString = crypto.randomBytes(6).toString('hex');
const randomEmail = `admin_${randomString}@test.com`;

// ID de la organización y datos del usuario
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799';
const securePassword = 'Password123!';

const userData = {
  email: randomEmail,
  password: securePassword,
  firstName: 'Admin',
  lastName: 'Test',
  role: 'admin',
  organizationId: organizationId
};

// Función principal
async function createAdminUser() {
  console.log('\n=================================================');
  console.log('  CREACIÓN DE USUARIO ADMIN CON SDK SUPABASE');
  console.log('=================================================\n');
  
  console.log('Creando usuario con los siguientes datos:');
  console.log(`- Email: ${userData.email}`);
  console.log(`- Nombre: ${userData.firstName} ${userData.lastName}`);
  console.log(`- Rol: ${userData.role}`);
  console.log(`- ID de Organización: ${userData.organizationId}`);
  console.log(`- Contraseña: ${userData.password}`);

  try {
    // 1. Verificar si la organización existe
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', userData.organizationId)
      .single();

    if (orgError) {
      throw new Error(`Error al verificar la organización: ${orgError.message}`);
    }

    if (!organizations) {
      throw new Error(`La organización con ID ${userData.organizationId} no existe`);
    }

    console.log(`\nOrganización verificada: ${organizations.name} (${organizations.id})`);

    // 2. Crear el usuario con el SDK de Admin Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en auth: ${authError.message}`);
    }

    console.log(`\nUsuario creado en auth.users con ID: ${authUser.user.id}`);

    // 3. Actualizar rol y organización directamente
    const { data: userUpdate, error: updateError } = await supabase
      .from('users')
      .update({
        role: userData.role,
        organization_id: userData.organizationId,
        first_name: userData.firstName,
        last_name: userData.lastName
      })
      .eq('id', authUser.user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error(`Error actualizando usuario en tabla users: ${updateError.message}`);
      
      // Si falla la actualización pero el usuario fue creado, intentamos otra estrategia
      // Insertar directamente en la tabla users (puede ser redundante si el trigger ya lo hizo)
      console.log('Intentando insertar directamente en la tabla users...');
      
      const { data: insertUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: userData.email,
          role: userData.role,
          first_name: userData.firstName,
          last_name: userData.lastName,
          organization_id: userData.organizationId,
          status: 'active'
        })
        .select('*')
        .single();
        
      if (insertError) {
        throw new Error(`Error insertando usuario en tabla users: ${insertError.message}`);
      }
      
      console.log(`Usuario insertado en tabla users con ID: ${insertUser.id}`);
      console.log(JSON.stringify(insertUser, null, 2));
    } else {
      console.log(`Usuario actualizado en tabla users con ID: ${userUpdate.id}`);
      console.log(JSON.stringify(userUpdate, null, 2));
    }

    console.log('\n=================================================');
    console.log('  USUARIO CREADO EXITOSAMENTE');
    console.log('=================================================');
    console.log(`Email: ${userData.email}`);
    console.log(`Contraseña: ${userData.password}`);
    console.log(`Nombre: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`Organización: ${organizations.name} (${userData.organizationId})`);
    console.log('=================================================');

    return { authUser };
  } catch (error) {
    console.error('\nError en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Ejecutar el proceso
createAdminUser()
  .then(() => {
    console.log('Proceso completado con éxito.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error creando el usuario administrador:', error.message);
    process.exit(1);
  }); 