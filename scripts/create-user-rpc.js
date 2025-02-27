// Script para crear un usuario asociado a una organización usando la función RPC
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

// Función para crear un usuario usando la función RPC create_enterprise_user
function createEnterpriseUser(orgId, userEmail, userPassword) {
  return new Promise((resolve, reject) => {
    // Datos para la llamada a la función
    const data = JSON.stringify({
      org_id: orgId,
      user_email: userEmail,
      user_password: userPassword
    });

    // Obtener el hostname
    const url = new URL(SUPABASE_URL);
    const hostname = url.hostname;

    // Opciones para la solicitud HTTP
    const options = {
      hostname: hostname,
      path: '/rest/v1/rpc/create_enterprise_user',
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
            const userId = responseData.replace(/"/g, ''); // La respuesta puede venir como "uuid"
            resolve(userId);
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error de API RPC: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          console.error('Error procesando respuesta:', error, responseData);
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
console.log('Creando usuario con los siguientes datos:');
console.log(`- Email: ${email}`);
console.log(`- Contraseña: ${password}`);
console.log(`- ID Organización: ${organizationId}`);

createEnterpriseUser(organizationId, email, password)
  .then((userId) => {
    console.log('\nUsuario creado exitosamente.');
    console.log('------------------------');
    console.log(`ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Organización: ${organizationId}`);
    console.log('------------------------');
    
    // Guardar las credenciales en un archivo para referencia
    const credentials = {
      userId,
      email,
      password,
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