import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createExecuteSqlFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_command: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_command text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          EXECUTE sql_command;
        END;
        $$;

        REVOKE ALL ON FUNCTION execute_sql(text) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
      `
    })

    if (error) throw error
    console.log('Función execute_sql creada exitosamente')
  } catch (error) {
    console.error('Error al crear la función execute_sql:', error)
  }
}

createExecuteSqlFunction() 