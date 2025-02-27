const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase usando las credenciales del archivo .env
const supabaseUrl = 'https://wldiefpqmfjxernvuywv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMwNjQyNSwiZXhwIjoyMDUxODgyNDI1fQ.x8UvBDoBWGJZeyZ8HEnUpAmvmafYnqJ9OpDqgFHHLxs';

// Creamos el cliente de Supabase con privilegios de administrador para ver toda la estructura
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para listar las tablas de la base de datos
async function listTables() {
  try {
    console.log('---- LISTA DE TABLAS ----');
    
    // Consultamos directamente las tablas del esquema public
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename, tableowner, tablespace, hasindexes, hasrules, hastriggers, rowsecurity')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Error al listar tablas:', error);
      // Intento alternativo con SQL directo
      const { data: sqlData, error: sqlError } = await supabase.rpc('list_tables_sql');
      if (sqlError) {
        console.error('Error al usar SQL directo:', sqlError);
        return;
      }
      console.table(sqlData);
      return;
    }
    
    console.table(data);
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Función para consultar directamente con SQL
async function querySQL(sql) {
  try {
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
    if (error) {
      console.error('Error al ejecutar SQL:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error inesperado al ejecutar SQL:', error);
    return null;
  }
}

// Función para consultar datos de una tabla específica
async function queryTable(tableName, limit = 10) {
  try {
    console.log(`---- CONSULTANDO DATOS DE ${tableName} (limitado a ${limit} registros) ----`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error(`Error al consultar la tabla ${tableName}:`, error);
      return;
    }
    
    console.table(data);
    console.log(`Total de registros mostrados: ${data.length}`);
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

// Obtener lista simple de tablas
async function getSimpleTableList() {
  try {
    const { data, error } = await supabase.from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Error al obtener lista de tablas:', error);
      return [];
    }
    
    return data.map(row => row.tablename);
  } catch (error) {
    console.error('Error inesperado:', error);
    return [];
  }
}

// Función principal que ejecuta todas las consultas
async function exploreDatabase() {
  console.log('Conectando a Supabase y explorando la estructura de la base de datos...');
  
  // Intentar crear la función run_sql si no existe
  try {
    await supabase.rpc('create_run_sql_function').catch(e => {
      console.log('No se pudo crear la función run_sql:', e.message);
    });
  } catch (error) {
    console.log('Error al crear función run_sql:', error.message);
  }
  
  // Listamos las tablas
  await listTables();
  
  // Obtenemos la lista de tablas para consultarlas una por una
  const tables = await getSimpleTableList();
  
  // Si no pudimos obtener la lista, usar algunas tablas comunes de ejemplo
  const tablesToQuery = tables.length > 0 ? tables : [
    'users', 'profiles', 'organizations', 'assignments', 'facilities',
    'inventory', 'maintenance_schedules', 'maintenance_tasks', 'workers',
    'reports', 'notifications', 'documents', 'role_permissions'
  ];
  
  console.log('\n---- TABLAS ENCONTRADAS ----');
  console.log(tablesToQuery.join(', '));
  
  // Consultamos cada tabla
  for (const table of tablesToQuery) {
    await queryTable(table, 3); // Mostramos solo 3 registros de cada tabla
  }
  
  console.log('Exploración completada.');
}

// Crear la función run_sql (meta-función)
async function createRunSqlFunction() {
  const sql = `
    CREATE OR REPLACE FUNCTION run_sql(sql_query text)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result jsonb;
    BEGIN
      EXECUTE sql_query INTO result;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('error', SQLERRM);
    END;
    $$;
  `;
  
  try {
    // Intentamos ejecutar el SQL directamente (esto solo funcionaría si tuviéramos permisos)
    const { error } = await supabase.rpc('run_admin_sql', { sql });
    if (error) {
      console.error('No se pudo crear la función run_sql:', error);
    } else {
      console.log('Función run_sql creada correctamente');
    }
  } catch (error) {
    console.error('Error al crear la función run_sql:', error);
  }
}

// Crear función para listar tablas con SQL
async function createListTablesSqlFunction() {
  const sql = `
    CREATE OR REPLACE FUNCTION list_tables_sql()
    RETURNS jsonb
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          tablename, 
          tableowner, 
          tablespace, 
          hasindexes, 
          hasrules, 
          hastriggers, 
          rowsecurity
        FROM 
          pg_tables
        WHERE 
          schemaname = 'public'
        ORDER BY 
          tablename
      ) t;
    $$;
  `;
  
  try {
    // Intentamos ejecutar el SQL directamente (esto solo funcionaría si tuviéramos permisos)
    const { error } = await supabase.rpc('run_admin_sql', { sql });
    if (error) {
      console.error('No se pudo crear la función list_tables_sql:', error);
    } else {
      console.log('Función list_tables_sql creada correctamente');
    }
  } catch (error) {
    console.error('Error al crear la función list_tables_sql:', error);
  }
}

// Ejecutar el script
exploreDatabase().catch(error => {
  console.error('Error en la exploración de la base de datos:', error);
}); 