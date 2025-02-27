/**
 * Script para crear múltiples usuarios en lote en FacilityManagerPro
 * 
 * Requisito: Primero debe ejecutarse el script SQL para implementar las funciones RPC
 * en la base de datos (create-user-sql-script.sql)
 * 
 * Uso:
 * 1. Actualiza la lista de usuarios en la sección usersToCreate o proporciona un archivo JSON/CSV
 * 2. Ejecuta el script con: node batch-create-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Si quieres usar CSV, instala con: npm install csv-parser

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ruta a posibles archivos de entrada
const CSV_FILE_PATH = path.join(__dirname, 'users-to-create.csv');
const JSON_FILE_PATH = path.join(__dirname, 'users-to-create.json');

// Lista de usuarios a crear (definir directamente en el código)
// Si se encuentra CSV o JSON, tendrá prioridad sobre esta lista
const defaultUsersToCreate = [
  {
    email: "admin1@facilitymanagerpro.com",
    password: "SecurePassword123!",
    first_name: "Admin",
    last_name: "Uno",
    role: "admin",
    organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584" // HospitalesGlobales
  },
  {
    email: "admin2@facilitymanagerpro.com",
    password: "SecurePassword123!",
    first_name: "Admin",
    last_name: "Dos",
    role: "admin",
    organization_id: "0d7f71d0-1b5f-473f-a3d5-68c3abf99584" // HospitalesGlobales
  }
  // Añadir más usuarios según sea necesario
];

/**
 * Carga usuarios desde un archivo CSV
 * @returns {Promise<Array>} Lista de usuarios
 */
async function loadUsersFromCSV() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      resolve(null);
      return;
    }

    const users = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => users.push({
        email: data.email,
        password: data.password || 'SecurePassword123!', // Valor por defecto
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role || 'admin', // Valor por defecto
        organization_id: data.organization_id
      }))
      .on('end', () => {
        if (users.length === 0) {
          console.log('CSV file exists but contains no valid data.');
          resolve(null);
        } else {
          console.log(`Loaded ${users.length} users from CSV file.`);
          resolve(users);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        resolve(null);
      });
  });
}

/**
 * Carga usuarios desde un archivo JSON
 * @returns {Promise<Array>} Lista de usuarios
 */
async function loadUsersFromJSON() {
  if (!fs.existsSync(JSON_FILE_PATH)) {
    return null;
  }

  try {
    const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const users = JSON.parse(data);
    if (Array.isArray(users) && users.length > 0) {
      console.log(`Loaded ${users.length} users from JSON file.`);
      return users;
    } else {
      console.log('JSON file exists but contains no valid data.');
      return null;
    }
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return null;
  }
}

/**
 * Guarda los resultados en un archivo
 * @param {Object} results Resultados de la creación de usuarios
 */
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `user-creation-results-${timestamp}.json`;
  fs.writeFileSync(fileName, JSON.stringify(results, null, 2));
  console.log(`\nLos resultados detallados se han guardado en "${fileName}"`);
}

/**
 * Verifica la existencia de un usuario por email
 * @param {string} email Email a verificar
 * @returns {Promise<boolean>} True si el usuario existe
 */
async function checkUserExists(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error(`Error checking if user ${email} exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error general checking user ${email}:`, error);
    return false;
  }
}

/**
 * Verifica la existencia de la organización
 * @param {string} organizationId ID de la organización
 * @returns {Promise<boolean>} True si la organización existe
 */
async function checkOrganizationExists(organizationId) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error checking organization ${organizationId}:`, error);
      return false;
    }
    
    if (data) {
      console.log(`Organization exists: ${data.name} (${data.id})`);
      return true;
    } else {
      console.error(`Organization with ID ${organizationId} not found.`);
      return false;
    }
  } catch (error) {
    console.error(`Error general checking organization ${organizationId}:`, error);
    return false;
  }
}

/**
 * Función principal para crear usuarios en lote
 */
async function createUsers() {
  console.log(`===== CREANDO USUARIOS EN LOTE =====`);
  
  // Intentar cargar usuarios desde un archivo CSV o JSON
  let usersToCreate = await loadUsersFromJSON();
  if (!usersToCreate) {
    usersToCreate = await loadUsersFromCSV();
  }
  
  // Si no se cargaron usuarios de archivos, usar la lista predeterminada
  if (!usersToCreate) {
    console.log('Using default user list defined in the script.');
    usersToCreate = defaultUsersToCreate;
  }
  
  console.log(`Total de usuarios a crear: ${usersToCreate.length}`);
  
  // Crear objeto para almacenar resultados
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total: usersToCreate.length,
      successful: 0,
      failed: 0,
      skipped: 0
    },
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Función para verificar si un usuario tiene todos los campos necesarios
  const validateUser = (user) => {
    const requiredFields = ['email', 'password', 'first_name', 'last_name', 'role', 'organization_id'];
    const missingFields = requiredFields.filter(field => !user[field]);
    return missingFields.length === 0 ? null : missingFields;
  };
  
  // Procesar cada usuario
  for (let i = 0; i < usersToCreate.length; i++) {
    const user = usersToCreate[i];
    
    console.log(`\n[${i+1}/${usersToCreate.length}] Procesando usuario: ${user.email}`);
    
    // Validar que el usuario tenga todos los campos necesarios
    const missingFields = validateUser(user);
    if (missingFields) {
      console.error(`Error: Faltan campos requeridos: ${missingFields.join(', ')}`);
      results.failed.push({
        email: user.email || 'unknown',
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
      results.summary.failed++;
      continue;
    }
    
    // Verificar si el usuario ya existe
    if (await checkUserExists(user.email)) {
      console.log(`El usuario ${user.email} ya existe. Saltando...`);
      results.skipped.push({
        email: user.email,
        reason: 'User already exists'
      });
      results.summary.skipped++;
      continue;
    }
    
    // Verificar si la organización existe
    if (!(await checkOrganizationExists(user.organization_id))) {
      console.error(`Error: La organización con ID ${user.organization_id} no existe.`);
      results.failed.push({
        email: user.email,
        error: `Organization with ID ${user.organization_id} not found`
      });
      results.summary.failed++;
      continue;
    }
    
    try {
      // Llamar a la función RPC para crear el usuario
      console.log(`Creando usuario: ${user.email}...`);
      const { data, error } = await supabase.rpc('create_user_rpc', {
        email: user.email,
        password: user.password,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      });
      
      if (error) {
        console.error(`Error al crear usuario ${user.email}:`, error);
        results.failed.push({
          email: user.email,
          error: error.message
        });
        results.summary.failed++;
        continue;
      }
      
      console.log(`¡Usuario ${user.email} creado exitosamente con ID: ${data}!`);
      results.successful.push({
        email: user.email,
        id: data,
        first_name: user.first_name,
        last_name: user.last_name
      });
      results.summary.successful++;
      
      // Añadir un pequeño retraso para evitar sobrecarga en el servidor
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error general para ${user.email}:`, error);
      results.failed.push({
        email: user.email,
        error: error.message
      });
      results.summary.failed++;
    }
  }
  
  // Resumen final
  console.log('\n===== RESUMEN DE CREACIÓN DE USUARIOS =====');
  console.log(`Total procesados: ${results.summary.total}`);
  console.log(`Exitosos: ${results.summary.successful}`);
  console.log(`Fallidos: ${results.summary.failed}`);
  console.log(`Saltados: ${results.summary.skipped}`);
  
  // Guardar los resultados en un archivo
  saveResults(results);
  
  return results;
}

// Ejecutar la función
createUsers().then(results => {
  console.log('\nProceso completado.');
}).catch(err => {
  console.error('Error fatal:', err);
});

// Ejemplo de formato de archivo CSV:
// email,password,first_name,last_name,role,organization_id
// user1@example.com,Password123!,John,Doe,admin,0d7f71d0-1b5f-473f-a3d5-68c3abf99584
// user2@example.com,Password123!,Jane,Smith,admin,0d7f71d0-1b5f-473f-a3d5-68c3abf99584

// Ejemplo de formato de archivo JSON:
/*
[
  {
    "email": "user1@example.com",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "organization_id": "0d7f71d0-1b5f-473f-a3d5-68c3abf99584"
  },
  {
    "email": "user2@example.com",
    "password": "Password123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "admin",
    "organization_id": "0d7f71d0-1b5f-473f-a3d5-68c3abf99584"
  }
]
*/ 