// Script para verificar el acceso a las APIs administrativas de Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar credenciales
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son necesarias');
  process.exit(1);
}

console.log('URL de Supabase:', supabaseUrl);
console.log('Service Key (primeros 20 caracteres):', supabaseServiceKey.substring(0, 20) + '...');

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSupabaseAccess() {
  console.log('\n----- Verificando acceso a Supabase -----');

  try {
    // 1. Verificar si podemos listar usuarios (requiere privilegios admin)
    console.log('\n1. Intentando listar usuarios...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10
    });

    if (usersError) {
      console.error('❌ Error al listar usuarios:', usersError.message);
    } else {
      console.log('✅ Acceso a listado de usuarios correcto');
      console.log(`   Total usuarios: ${users?.users?.length || 0}`);
    }

    // 2. Verificar acceso a tablas del esquema public
    console.log('\n2. Verificando acceso a esquema public...');
    const { error: publicError } = await supabase
      .from('_dummy_query_for_check')
      .select('*')
      .limit(1)
      .catch(e => ({ error: e }));

    if (publicError) {
      if (publicError.message.includes('does not exist')) {
        console.log('✅ Conexión a esquema public funciona (tabla no existe, pero conexión OK)');
      } else {
        console.error('❌ Error de acceso a esquema public:', publicError.message);
      }
    }

    // 3. Verificar si el servicio está disponible
    console.log('\n3. Verificando estado del servicio...');
    const { error: healthError } = await supabase
      .rpc('_dummy_function_for_check')
      .catch(e => ({ error: e }));

    if (healthError) {
      if (healthError.message.includes('does not exist')) {
        console.log('✅ Servicio RPC disponible (función no existe, pero servicio OK)');
      } else {
        console.error('❌ Error en servicio RPC:', healthError.message);
      }
    }

    console.log('\n----- Diagnóstico final -----');
    if (usersError) {
      console.log('❌ No tienes acceso administrativo a Supabase o hay un problema con la clave de servicio.');
      console.log('   Posibles soluciones:');
      console.log('   1. Verifica que la SUPABASE_SERVICE_ROLE_KEY sea correcta');
      console.log('   2. Asegúrate que el proyecto exista y esté activo');
      console.log('   3. Contacta al soporte de Supabase si persiste el problema');
    } else {
      console.log('✅ Conexión con privilegios administrativos confirmada');
      console.log('   El problema para crear usuarios podría estar en:');
      console.log('   1. Falta de tablas requeridas (users, organizations, etc.)');
      console.log('   2. Error en triggers o funciones de base de datos');
      console.log('   3. Problema de permisos en ciertas operaciones específicas');
    }

  } catch (err) {
    console.error('\n❌ Error general:', err.message);
  }
}

// Ejecutar verificación
checkSupabaseAccess(); 