// Script para crear un usuario administrador usando SQL directo a través del RPC de Supabase
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
const randomEmail = `admin_${randomString}@test.com`;

// ID de la organización y datos del usuario
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799';
const securePassword = 'Password123!';

const userData = {
  email: randomEmail,
  password: securePassword,
  firstName: 'Admin',
  lastName: 'Directo',
  role: 'admin',
  organizationId: organizationId
};

// Verifica la organización
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

// Ejecuta SQL directamente en Supabase
function executeSQL(sql, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const data = JSON.stringify({
      query: sql,
      params: params
    });

    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/exec_sql',
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
            if (responseData) {
              try {
                const result = JSON.parse(responseData);
                resolve(result);
              } catch {
                resolve(responseData);
              }
            } else {
              resolve(null);
            }
          } else {
            console.error(`Error SQL: ${res.statusCode} - ${responseData}`);
            reject(new Error(`Error ejecutando SQL: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Error al procesar respuesta: ${error.message}`));
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

// Crear usuario mediante SQL directo
async function createUserDirect() {
  console.log('\n=================================================');
  console.log('  CREACIÓN DE USUARIO ADMIN DIRECTAMENTE VÍA SQL');
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

    // 2. Verificar que la función exec_sql existe
    try {
      const checkFunctionSQL = `
        SELECT EXISTS (
          SELECT 1 
          FROM pg_proc 
          WHERE proname = 'exec_sql'
        ) as exists
      `;
      const functionExists = await executeSQL(checkFunctionSQL);
      console.log(`\nVerificación de función exec_sql: ${JSON.stringify(functionExists)}`);
      
      if (!functionExists || (Array.isArray(functionExists) && functionExists.length === 0) || 
          (typeof functionExists === 'object' && !functionExists.exists)) {
        // La función no existe, hay que crearla
        console.log('La función exec_sql no existe. Creándola...');
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION exec_sql(query text, params jsonb DEFAULT '{}'::jsonb)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          DECLARE
            result jsonb;
          BEGIN
            EXECUTE query INTO result;
            RETURN result;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
          END;
          $$;
        `;
        await executeSQL(createFunctionSQL);
        console.log('Función exec_sql creada con éxito.');
      }
    } catch (error) {
      console.log(`Error al verificar la función exec_sql: ${error.message}`);
      console.log('Continuando con el proceso...');
    }

    // 3. Crear el usuario directamente en auth.users con SQL
    const createUserSQL = `
      WITH inserted_auth_user AS (
        INSERT INTO auth.users (
          email,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          encrypted_password
        ) VALUES (
          '${userData.email}',
          '{"provider":"email","providers":["email"]}',
          '{"first_name":"${userData.firstName}","last_name":"${userData.lastName}","role":"${userData.role}"}',
          false,
          crypt('${userData.password}', gen_salt('bf'))
        ) RETURNING id, email
      ), 
      inserted_user AS (
        INSERT INTO public.users (
          id,
          email,
          role,
          first_name,
          last_name,
          status,
          organization_id,
          created_at,
          updated_at
        ) 
        SELECT 
          id,
          email,
          '${userData.role}',
          '${userData.firstName}',
          '${userData.lastName}',
          'active',
          '${userData.organizationId}',
          NOW(),
          NOW()
        FROM inserted_auth_user
        RETURNING id, email, role, first_name, last_name, organization_id
      )
      SELECT * FROM inserted_user
    `;

    const result = await executeSQL(createUserSQL);
    console.log('\nResultado de la creación del usuario:', JSON.stringify(result, null, 2));

    console.log('\n=================================================');
    console.log('  USUARIO CREADO EXITOSAMENTE');
    console.log('=================================================');
    console.log(`Email: ${userData.email}`);
    console.log(`Contraseña: ${userData.password}`);
    console.log(`Nombre: ${userData.firstName} ${userData.lastName}`);
    console.log(`Rol: ${userData.role}`);
    console.log(`Organización: ${organization.name} (${userData.organizationId})`);
    console.log('=================================================');

    return result;
  } catch (error) {
    console.error('\nError en el proceso de creación de usuario:', error.message);
    throw error;
  }
}

// Ejecutar el proceso
createUserDirect()
  .then(() => {
    console.log('Proceso completado con éxito.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error creando el usuario administrador:', error.message);
    process.exit(1);
  }); 