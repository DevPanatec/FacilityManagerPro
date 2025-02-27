// Script para depurar la creación de usuarios en Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validación de credenciales
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son necesarias');
  process.exit(1);
}

console.log('Configuración de Supabase:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 15)}...`); // Solo mostrar parte de la clave por seguridad

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para verificar las tablas disponibles
async function checkTables() {
  console.log('\n---- Verificando tablas disponibles ----');
  
  try {
    // Ejecutar una consulta SQL para obtener las tablas de la base de datos
    const { data, error } = await supabase.rpc('check_tables');
    
    if (error) {
      console.error('❌ Error al verificar tablas:', error.message);
      
      // Si el RPC no existe, probemos con una consulta directa a auth.users
      console.log('\nIntentando verificar si podemos acceder a auth.users...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (authError) {
        console.error('❌ Error accediendo a auth.users:', authError.message);
      } else {
        console.log('✅ Acceso a auth.users correcto');
        console.log('Total de usuarios:', authData.users.length > 0 ? authData.users.length : 'No hay usuarios');
      }
      
      // Intentemos verificar tablas comunes
      await checkTableExists('users');
      await checkTableExists('organizations');
      await checkTableExists('hospitals');
    } else {
      console.log('✅ Tablas disponibles:', data);
    }
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

// Función auxiliar para verificar si una tabla existe
async function checkTableExists(tableName) {
  try {
    console.log(`\nVerificando si existe la tabla '${tableName}'...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ Error: La tabla '${tableName}' no existe o no es accesible:`, error.message);
      return false;
    }
    
    console.log(`✅ La tabla '${tableName}' existe y es accesible`);
    return true;
  } catch (err) {
    console.error(`❌ Error verificando tabla '${tableName}':`, err.message);
    return false;
  }
}

// Función para probar la creación simple de un usuario auth
async function testCreateAuthUser() {
  console.log('\n---- Prueba: Crear usuario básico sin metadatos ----');
  
  try {
    // Generar un email único
    const uniqueEmail = `test.user.${Date.now()}@example.com`;
    
    console.log(`Intentando crear usuario con email: ${uniqueEmail}`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      password: 'Password123!',
      email_confirm: true
    });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.details) console.error(`Detalles: ${error.details}`);
      return false;
    }

    console.log('✅ Usuario auth creado con éxito:', data.user.id);
    return data.user.id;
  } catch (err) {
    console.error(`❌ Error inesperado: ${err.message}`);
    return false;
  }
}

// Ejecutar pruebas de diagnóstico
async function runDiagnostics() {
  try {
    // Verificar tablas
    await checkTables();
    
    // Intentar crear un usuario básico
    await testCreateAuthUser();
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Iniciar diagnóstico
runDiagnostics(); 