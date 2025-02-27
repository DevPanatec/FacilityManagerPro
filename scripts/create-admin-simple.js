// Script para crear un usuario administrador usando directamente las APIs REST de Supabase
const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
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

// Generar email aleatorio para evitar conflictos
const randomString = crypto.randomBytes(6).toString('hex');
const randomEmail = `usuario_${randomString}@test.com`;

// ID de la organización y datos del usuario
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799';
const securePassword = 'Password123!';

const userData = {
  email: randomEmail,
  password: securePassword,
  firstName: 'Usuario',
  lastName: 'Prueba',
  // Cambiando el rol de 'admin' a 'usuario' para probar si es una restricción con el rol
  role: 'usuario',
  organizationId: organizationId
};

// Función principal para crear un usuario administrador
async function createAdminUser() {
  console.log('\n=================================================');
  console.log('  CREACIÓN DE USUARIO DE PRUEBA EN SUPABASE');
  console.log('=================================================\n');
  
  console.log('Creando usuario con los siguientes datos:');
  console.log(`- Email: ${userData.email}`);
  console.log(`- Nombre: ${userData.firstName} ${userData.lastName}`);
  console.log(`- Rol: ${userData.role}`);
  console.log(`- ID de Organización: ${userData.organizationId}`);
  console.log(`- Contraseña: ${userData.password}`);

  try {
    // 1. Verificar si la organización existe
    const organization = await verifyOrganization();
    console.log(`\nOrganización verificada: ${organization.name} (${organization.id})`);

    // 2. Crear el usuario en auth.users
    const authUser = await createAuthUser();
    console.log(`\nUsuario creado en auth.users con ID: ${authUser.id}`);

    // 3. Crear el registro en la tabla users
    const userRecord = await createUserRecord(authUser.id);
    console.log(`\nUsuario insertado en tabla users con ID: ${userRecord.id}`);

    // 4. Guardar credenciales en un archivo para referencia
    const credentials = {
      id: authUser.id,
      email: userData.email,
      password: userData.password,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      organizationId: userData.organizationId,
      organizationName: organization.name
    };

    const credentialsFilePath = path.resolve(__dirname, 'test_user_credentials.json');
    fs.writeFileSync(
      credentialsFilePath,
      JSON.stringify(credentials, null, 2)
    );

    console.log(`\nCredenciales guardadas en: ${credentialsFilePath}`);
    console.log('\n=================================================');
    console.log('  RESUMEN DEL USUARIO CREADO');
    console.log('=================================================');
    console.log(`ID: ${authUser.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Contraseña: ${userData.password}`);
    console.log(`Nombre completo: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`Organización: ${organization.name} (${userData.organizationId})`);
    console.log('=================================================');
    console.log('\nProceso completado exitosamente.');

    return { authUser, userRecord };
  } catch (error) {
    console.error('\nError en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Verificar que la organización existe
function verifyOrganization() {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: `/rest/v1/organizations?id=eq.${encodeURIComponent(organizationId)}&select=id,name`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const organizations = JSON.parse(responseData);
          if (organizations && organizations.length > 0) {
            resolve(organizations[0]);
          } else {
            reject(new Error(`La organización con ID ${organizationId} no existe`));
          }
        } catch (error) {
          reject(new Error(`Error al verificar la organización: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error de conexión: ${error.message}`));
    });

    req.end();
  });
}

// Crear un usuario en auth.users
function createAuthUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role
      }
    });

    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const user = JSON.parse(responseData);
            resolve(user);
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error creando usuario en auth: ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Error al procesar respuesta de auth: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error de conexión: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

// Crear un registro en la tabla users
function createUserRecord(userId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      id: userId,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
      organization_id: userData.organizationId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const records = JSON.parse(responseData);
            if (Array.isArray(records) && records.length > 0) {
              resolve(records[0]);
            } else {
              reject(new Error('No se recibió respuesta esperada después de crear el usuario'));
            }
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            
            // Si hay error, intentar eliminar el usuario de auth
            deleteAuthUser(userId).catch(err => console.error('Error eliminando usuario auth:', err.message));
            
            reject(new Error(`Error insertando en tabla users: ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Error al procesar respuesta de users: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error de conexión: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

// Eliminar un usuario de auth.users (en caso de error)
function deleteAuthUser(userId) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: `/auth/v1/admin/users/${userId}`,
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Usuario auth eliminado correctamente');
          resolve();
        } else {
          reject(new Error(`Error eliminando usuario auth: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Error de conexión: ${error.message}`));
    });

    req.end();
  });
}

// Ejecutar el proceso de creación de usuario
createAdminUser()
  .catch((error) => {
    console.error('\nError creando el usuario administrador:', error.message);
    process.exit(1);
  }); 