const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exploreFunctions() {
  try {
    console.log('Explorando funciones disponibles en Supabase...');

    // Intentar obtener las funciones disponibles
    console.log('\n1. Intentando obtener funciones desde pg_proc:');
    try {
      // Esta consulta podría fallar si no tenemos acceso a las tablas del sistema
      const { data: functions, error: functionsError } = await supabase.rpc('get_available_functions');
      
      if (functionsError) {
        console.log('Error al obtener funciones:', functionsError);
      } else {
        console.log('Funciones disponibles:');
        console.log(functions);
      }
    } catch (err) {
      console.log('No se pudo consultar las funciones con get_available_functions, intentando otra aproximación');
    }

    // Intentar obtener funciones definidas en la base de datos
    console.log('\n2. Intentando listar funciones RPC disponibles:');
    try {
      // Consultar las funciones RPC disponibles directamente
      const { data: rpcFunctions, error: rpcError } = await supabase
        .from('_rpc')
        .select('*');
      
      if (rpcError) {
        console.log('Error al obtener funciones RPC:', rpcError);
      } else {
        console.log('Funciones RPC disponibles:');
        console.log(rpcFunctions);
      }
    } catch (err) {
      console.log('No se pudo consultar _rpc, intentando otro enfoque');
    }

    // Probar consultas RPC específicas que podrían existir
    console.log('\n3. Probando funciones RPC específicas:');
    
    // Lista de posibles funciones RPC a probar
    const possibleFunctions = [
      'create_user',
      'register_user',
      'add_user',
      'new_user',
      'create_admin_user',
      'add_admin'
    ];

    for (const funcName of possibleFunctions) {
      console.log(`\nProbando función RPC: ${funcName}`);
      try {
        // Intentar llamar a la función con algunos parámetros básicos
        const { data, error } = await supabase.rpc(funcName, {
          check_only: true, // Parámetro para indicar que solo queremos verificar si existe
          email: 'test@example.com' // Parámetro genérico que podrían esperar estas funciones
        });
        
        if (error) {
          console.log(`Error al probar ${funcName}:`, error.message);
        } else {
          console.log(`¡Función ${funcName} disponible!`);
          console.log('Respuesta:', data);
        }
      } catch (err) {
        console.log(`No se pudo llamar a ${funcName}:`, err.message);
      }
    }

    // Explorar los triggers asociados a la tabla de usuarios
    console.log('\n4. Explorando triggers en la tabla users:');
    try {
      const { data: triggers, error: triggersError } = await supabase.rpc('get_table_triggers', {
        table_name: 'users'
      });
      
      if (triggersError) {
        console.log('Error al obtener triggers:', triggersError);
      } else {
        console.log('Triggers en la tabla users:');
        console.log(triggers || 'No se encontraron resultados');
      }
    } catch (err) {
      console.log('No se pudo consultar los triggers');
    }

    // Intentar verificar métodos específicos de autenticación con service_key
    console.log('\n5. Verificando métodos disponibles con service_key:');
    const methodsToCheck = [
      'auth.admin',
      'auth.api',
      'auth.signUp',
      'auth.signIn'
    ];
    
    for (const method of methodsToCheck) {
      console.log(`Verificando disponibilidad de ${method}`);
      let isAvailable = false;
      
      try {
        // Verificamos si el método está disponible en el cliente de Supabase
        let parts = method.split('.');
        let obj = supabase;
        
        for (const part of parts) {
          if (obj && typeof obj[part] !== 'undefined') {
            obj = obj[part];
            isAvailable = true;
          } else {
            isAvailable = false;
            break;
          }
        }
        
        console.log(`${method}: ${isAvailable ? 'Disponible' : 'No disponible'}`);
      } catch (err) {
        console.log(`Error al verificar ${method}:`, err.message);
      }
    }

    // Consultar usuarios existentes para entender la estructura
    console.log('\n6. Examinando la estructura de usuarios existentes:');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('Error al obtener usuarios:', usersError);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('Estructura de un usuario existente:');
      const user = existingUsers[0];
      const userFields = Object.keys(user);
      
      console.log('Campos disponibles:', userFields.join(', '));
      
      // Verificar campos requeridos vs opcionales
      console.log('\nComprobando valores no nulos (probablemente requeridos):');
      userFields.forEach(field => {
        if (user[field] !== null) {
          console.log(`- ${field}: ${typeof user[field]} = ${user[field]}`);
        }
      });
      
      console.log('\nCampos nulos (probablemente opcionales):');
      userFields.forEach(field => {
        if (user[field] === null) {
          console.log(`- ${field}`);
        }
      });
    } else {
      console.log('No se encontraron usuarios');
    }

  } catch (error) {
    console.error('Error general al explorar funciones:', error);
  }
}

// Ejecutar la exploración
exploreFunctions(); 