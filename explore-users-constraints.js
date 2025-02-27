const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exploreUsersTable() {
  console.log('===== EXPLORANDO RESTRICCIONES Y ESTRUCTURA DE LA TABLA USERS =====\n');

  try {
    // 1. Explorar los primeros registros de la tabla users
    console.log('1. Primeros 3 registros de users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);

    if (usersError) {
      console.error('Error al consultar users:', usersError);
    } else {
      console.log(users);
      console.log(`Total de registros mostrados: ${users.length}\n`);
    }

    // 2. Intentar explorar los roles y los valores no nulos en la tabla users
    console.log('2. Valores no nulos en registros existentes:');
    const { data: usersForAnalysis, error: usersAnalysisError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersAnalysisError) {
      console.error('Error al obtener datos para análisis:', usersAnalysisError);
    } else if (usersForAnalysis && usersForAnalysis.length > 0) {
      const user = usersForAnalysis[0];
      console.log('Campos con valores no nulos:');
      Object.keys(user).forEach(key => {
        if (user[key] !== null) {
          console.log(`- ${key}: ${typeof user[key]} = ${JSON.stringify(user[key])}`);
        }
      });
      
      console.log('\nCampos con valores nulos:');
      Object.keys(user).forEach(key => {
        if (user[key] === null) {
          console.log(`- ${key}`);
        }
      });
    }

    // 3. Intentar explorar la relación con auth usando usuarios existentes
    console.log('\n3. Explorando relación con auth.users:');
    const userId = users && users.length > 0 ? users[0].id : null;
    
    if (userId) {
      console.log(`Intentando usar ID existente: ${userId}`);
      
      // Intentar acceder a auth.users directamente (puede fallar por permisos)
      try {
        const { data: authUser, error: authError } = await supabase
          .from('auth.users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (authError) {
          console.error('Error al acceder a auth.users directamente:', authError);
        } else {
          console.log('Datos de auth.users:', authUser);
        }
      } catch (e) {
        console.error('Excepción al acceder a auth.users:', e.message);
      }
    }

    // 4. Explorar la estructura de la tabla mediante SQL personalizado
    console.log('\n4. Intentando explorar estructura y restricciones mediante SQL:');
    
    try {
      // Intentar usar RPC para ejecutar SQL
      const { data: structureData, error: structureError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'"
      });
      
      if (structureError) {
        console.error('Error al obtener estructura con RPC:', structureError);
      } else {
        console.log('Estructura de la tabla users:');
        console.log(structureData);
      }
    } catch (e) {
      console.error('Excepción al usar RPC para estructura:', e.message);
    }
    
    try {
      // Intentar obtener información sobre las restricciones
      const { data: constraintData, error: constraintError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) FROM pg_constraint con INNER JOIN pg_class rel ON rel.oid = con.conrelid INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace WHERE rel.relname = 'users' AND nsp.nspname = 'public'"
      });
      
      if (constraintError) {
        console.error('Error al obtener restricciones con RPC:', constraintError);
      } else {
        console.log('\nRestricciones de la tabla users:');
        console.log(constraintData);
      }
    } catch (e) {
      console.error('Excepción al usar RPC para restricciones:', e.message);
    }

    // 5. Explorar posibles funciones RPC existentes para crear usuarios
    console.log('\n5. Explorando funciones RPC existentes para crear usuarios:');
    
    const rpcCandidates = [
      'create_user',
      'create_admin_user',
      'register_user',
      'sign_up_user',
      'add_user',
      'insert_user',
      'new_user'
    ];
    
    for (const funcName of rpcCandidates) {
      try {
        console.log(`Verificando existencia de función RPC: ${funcName}`);
        const { data, error } = await supabase.rpc(funcName, {
          check_only: true,
          email: 'test@example.com'
        });
        
        if (error) {
          console.log(`- ${funcName}: No disponible o requiere otros parámetros (${error.message})`);
        } else {
          console.log(`- ${funcName}: DISPONIBLE!`);
          console.log('  Respuesta:', data);
        }
      } catch (e) {
        console.log(`- ${funcName}: Error al verificar (${e.message})`);
      }
    }

    // 6. Buscar schemas disponibles
    console.log('\n6. Explorando schemas disponibles:');
    try {
      const { data: schemasData, error: schemasError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
      });
      
      if (schemasError) {
        console.error('Error al obtener schemas:', schemasError);
      } else {
        console.log('Schemas disponibles:');
        console.log(schemasData);
      }
    } catch (e) {
      console.error('Excepción al consultar schemas:', e.message);
    }
    
    // 7. Verificar existencia de funciones de servicio por nombre
    console.log('\n7. Verificando funciones específicas de servicio:');
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT proname, pronamespace::regnamespace as schema, pronargs FROM pg_proc WHERE proname LIKE '%user%' ORDER BY proname"
      });
      
      if (functionError) {
        console.error('Error al buscar funciones de usuario:', functionError);
      } else {
        console.log('Funciones que contienen "user" en su nombre:');
        console.log(functionData);
      }
    } catch (e) {
      console.error('Excepción al buscar funciones:', e.message);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la exploración
exploreUsersTable().catch(err => {
  console.error('Error fatal:', err);
}); 