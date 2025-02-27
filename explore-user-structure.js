const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exploreUserStructure() {
  try {
    // 1. Obtener las tablas que tienen que ver con usuarios o autenticación
    console.log('Explorando tablas relacionadas con usuarios y autenticación...');
    
    // Intenta obtener las referencias de la tabla users
    console.log('\n1. Explorando referencias y claves extranjeras de la tabla "users":');
    try {
      const { data: foreignKeys, error: fkError } = await supabase.rpc('get_foreign_keys', { 
        table_name: 'users' 
      });
      
      if (fkError) {
        console.error('Error al obtener claves foráneas:', fkError);
      } else {
        console.log('Claves foráneas de la tabla users:');
        console.log(foreignKeys || 'No se encontraron resultados');
      }
    } catch (err) {
      console.log('No se pudo consultar foreign_keys, intentando otra aproximación');
    }

    // 2. Explorar la estructura de la tabla users
    console.log('\n2. Estructura de la tabla "users":');
    const { data: usersColumns, error: usersColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users');
    
    if (usersColumnsError) {
      console.error('Error al obtener estructura de users:', usersColumnsError);
    } else {
      console.log(usersColumns || 'No se encontraron resultados');
    }

    // 3. Explorar la tabla auth.users si existe
    console.log('\n3. Intentando explorar tabla "auth.users":');
    try {
      const { data: authUsers, error: authUsersError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(1);
      
      if (authUsersError) {
        console.error('Error al consultar auth.users:', authUsersError);
      } else {
        console.log('Estructura de auth.users:');
        console.log(authUsers ? 'Primera fila:' : 'No se encontraron resultados');
        console.log(authUsers);
      }
    } catch (err) {
      console.log('No se pudo acceder a auth.users, probablemente no existe o no es accesible');
    }

    // 4. Examinar un usuario existente
    console.log('\n4. Ejemplo de un usuario existente:');
    const { data: exampleUser, error: exampleUserError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
    
    if (exampleUserError) {
      console.error('Error al obtener usuario de ejemplo:', exampleUserError);
    } else {
      console.log(exampleUser || 'No se encontraron usuarios');
    }

    // 5. Verificar si hay una función RPC para crear usuarios
    console.log('\n5. Revisando funciones RPC disponibles:');
    try {
      const { data: procedures, error: proceduresError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname')
        .contains('proname', 'user');
      
      if (proceduresError) {
        console.error('Error al obtener procedimientos:', proceduresError);
      } else {
        console.log('Procedimientos relacionados con usuarios:');
        console.log(procedures || 'No se encontraron resultados');
      }
    } catch (err) {
      console.log('No se pudo acceder a pg_catalog.pg_proc');
    }
    
  } catch (error) {
    console.error('Error al explorar la estructura de usuarios:', error);
  }
}

// Ejecutar la exploración
exploreUserStructure(); 