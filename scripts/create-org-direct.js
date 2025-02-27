// Script para crear una organización en Supabase usando la API REST
const dotenv = require('dotenv');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Obtener el nombre de la organización
const organizationName = process.argv[2] || 'HospitalesGlobales';

// Función para crear organización usando HTTP directo
function createOrganization(name) {
  return new Promise((resolve, reject) => {
    // Datos a enviar
    const data = JSON.stringify([{
      name: name,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

    // Obtener el hostname del URL de Supabase
    const url = new URL(SUPABASE_URL);
    const hostname = url.hostname;
    
    // Opciones para la solicitud HTTP
    const options = {
      hostname: hostname,
      path: '/rest/v1/organizations',
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
            console.log('Organización creada exitosamente:');
            console.log(`ID: ${parsed[0].id}`);
            console.log(`Nombre: ${parsed[0].name}`);
            console.log(`Status: ${parsed[0].status}`);
            
            // Guardar el ID para uso futuro
            fs.writeFileSync(path.resolve(__dirname, 'last_organization_id.txt'), parsed[0].id);
            console.log(`ID guardado en: scripts/last_organization_id.txt`);
            
            resolve(parsed[0]);
          } else {
            console.error(`Error: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error de API: ${res.statusCode}`));
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

// Ejecutar la función
console.log(`Creando organización con nombre: ${organizationName}`);

createOrganization(organizationName)
  .then(() => {
    console.log('Proceso completado correctamente.');
  })
  .catch((error) => {
    console.error('Error creando la organización:', error.message);
  }); 