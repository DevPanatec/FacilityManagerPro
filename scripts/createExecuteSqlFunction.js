import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createExecuteSqlFunction() {
  try {
    console.log('Creando función execute_sql...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;

        GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
        GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
      `
    })

    if (error) {
      console.error('Error al crear la función:', error)
      return
    }

    console.log('Función execute_sql creada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

createExecuteSqlFunction() 