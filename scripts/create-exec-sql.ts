import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const createExecSql = async () => {
  try {
    // Crear la función exec_sql
    const { data, error } = await supabase
      .from('_sqlx')
      .select('*')
      .limit(1)
      .then(async () => {
        return await supabase.rpc('exec', {
          sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                EXECUTE sql_query;
            END;
            $$;

            -- Dar permisos a la función
            GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
            GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
          `
        })
      })

    if (error) {
      console.error('Error creando función:', error)
      return
    }

    console.log('Función exec_sql creada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

createExecSql() 