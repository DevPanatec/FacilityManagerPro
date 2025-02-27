// Script para crear un usuario administrador asociado a HospitalesGlobales
const dotenv = require('dotenv');
const path = require('path');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Datos del usuario
const userData = {
  email: 'alejandro.echevers@hospitalesglobales.com',
  password: `Admin${crypto.randomBytes(4).toString('hex')}!`,
  firstName: 'Alejandro',
  lastName: 'Echevers',
  role: 'admin',
  organizationId: '0d7f71d0-1b5f-473f-a3d5-68c3abf99584'
};

// Función para crear un usuario en auth y luego en la tabla users
async function createAdminUser() {
  console.log('Creando usuario administrador con los siguientes datos:');
  console.log(`- Email: ${userData.email}`);
  console.log(`- Contraseña: ${userData.password}`);
  console.log(`- Nombre: ${userData.firstName} ${userData.lastName}`);
  console.log(`- Rol: ${userData.role}`);
  console.log(`- ID Organización: ${userData.organizationId}`);

  try {
    // 1. Crear el usuario en auth.users
    const authUser = await createAuthUser();
    console.log(`\nUsuario creado en auth.users con ID: ${authUser.id}`);

    // 2. Crear el registro en la tabla users
    await createUserRecord(authUser.id);
    console.log(`\nUsuario asociado a la organización correctamente.`);

    return authUser;
  } catch (error) {
    console.error('Error en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Función para crear un usuario en auth.users
function createAuthUser() {
  return new Promise((resolve, reject) => {
    // Datos para el usuario
    const data = JSON.stringify({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    // Obtener el hostname
    const url = new URL(SUPABASE_URL);
    const hostname = url.hostname;

    // Opciones para la solicitud HTTP
    const options = {
      hostname: hostname,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    // Realizar la solicitud
    const req = https.request(options, (res) => {
      let responseData = '';

      // Recopilar datos de respuesta
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      // Finalizar y procesar respuesta
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error de API Auth: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('Error procesando respuesta de auth:', error, responseData);
          reject(error);
        }
      });
    });

    // Manejar errores de la solicitud
    req.on('error', (error) => {
      console.error('Error de conexión:', error);
      reject(error);
    });

    // Enviar datos y finalizar solicitud
    req.write(data);
    req.end();
  });
}

// Función para crear un registro en la tabla users
function createUserRecord(userId) {
  return new Promise((resolve, reject) => {
    // Datos para el registro de usuario
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

    // Obtener el hostname
    const url = new URL(SUPABASE_URL);
    const hostname = url.hostname;

    // Opciones para la solicitud HTTP
    const options = {
      hostname: hostname,
      path: '/rest/v1/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    // Realizar la solicitud
    const req = https.request(options, (res) => {
      let responseData = '';

      // Recopilar datos de respuesta
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      // Finalizar y procesar respuesta
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error en API Rest para users: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('Error procesando respuesta de users:', error, responseData);
          reject(error);
        }
      });
    });

    // Manejar errores de la solicitud
    req.on('error', (error) => {
      console.error('Error de conexión:', error);
      reject(error);
    });

    // Enviar datos y finalizar solicitud
    req.write(data);
    req.end();
  });
}

// Ejecutar el proceso de creación de usuario
createAdminUser()
  .then((authUser) => {
    console.log('\nResumen del usuario creado:');
    console.log('------------------------');
    console.log(`ID: ${authUser.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Contraseña: ${userData.password}`);
    console.log(`Nombre completo: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`Organización: ${userData.organizationId}`);
    console.log('------------------------');
    
    // Guardar las credenciales en un archivo para referencia
    const credentials = {
      userId: authUser.id,
      ...userData
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'admin_credentials.json'), 
      JSON.stringify(credentials, null, 2)
    );
    
    console.log('\nCredenciales guardadas en scripts/admin_credentials.json');
    console.log('Proceso completado correctamente.');
  })
  .catch((error) => {
    console.error('\nError creando el usuario administrador:', error.message);
  }); 