// Script para crear un usuario y asociarlo a una organización en Supabase
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

// Obtener los argumentos o usar valores predeterminados
const organizationId = process.argv[2] || '0d7f71d0-1b5f-473f-a3d5-68c3abf99584';
const email = process.argv[3] || `admin.${organizationId.substring(0, 8)}@hospitalesglobales.com`;
const password = process.argv[4] || `Admin${crypto.randomBytes(4).toString('hex')}!`;
const firstName = process.argv[5] || 'Administrador';
const lastName = process.argv[6] || 'HospitalesGlobales';
const role = process.argv[7] || 'admin';

// Función para crear un usuario en auth.users y luego en users
async function createUser() {
  console.log('Creando usuario con los siguientes datos:');
  console.log(`- Email: ${email}`);
  console.log(`- Contraseña: ${password}`);
  console.log(`- Nombre: ${firstName} ${lastName}`);
  console.log(`- Rol: ${role}`);
  console.log(`- ID Organización: ${organizationId}`);

  try {
    // 1. Primero crear el usuario en auth.users
    const authUser = await createAuthUser(email, password);
    console.log(`\nUsuario creado en auth.users con ID: ${authUser.id}`);

    // 2. Luego insertar en la tabla users personalizada
    const userData = await createUserRecord(authUser.id, email, firstName, lastName, role, organizationId);
    console.log(`\nUsuario asociado a la organización correctamente.`);

    return { authUser, userData };
  } catch (error) {
    console.error('Error en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Función para crear un usuario en auth.users
function createAuthUser(email, password) {
  return new Promise((resolve, reject) => {
    // Datos para el usuario
    const data = JSON.stringify({
      email: email,
      password: password,
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
function createUserRecord(userId, email, firstName, lastName, role, organizationId) {
  return new Promise((resolve, reject) => {
    // Datos para el registro de usuario
    const data = JSON.stringify({
      id: userId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: role,
      organization_id: organizationId,
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
            reject(new Error(`Error en API Rest para users: ${res.statusCode} - ${responseData}`));
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
createUser()
  .then(({ authUser, userData }) => {
    console.log('\nResumen del usuario creado:');
    console.log('------------------------');
    console.log(`ID: ${authUser.id}`);
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Nombre completo: ${firstName} ${lastName}`);
    console.log(`Rol: ${role}`);
    console.log(`Organización: ${organizationId}`);
    console.log('------------------------');
    
    // Guardar las credenciales en un archivo para referencia
    const credentials = {
      userId: authUser.id,
      email,
      password,
      firstName,
      lastName,
      role,
      organizationId
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'user_credentials.json'), 
      JSON.stringify(credentials, null, 2)
    );
    
    console.log('\nCredenciales guardadas en scripts/user_credentials.json');
    console.log('Proceso completado correctamente.');
  })
  .catch((error) => {
    console.error('\nError creando el usuario:', error.message);
  }); 