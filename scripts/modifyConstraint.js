import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const modificarRestriccion = async () => {
  try {
    // Primero creamos una función que nos permita ejecutar SQL
    const { error: createFunctionError } = await supabase.rpc('exec_sql', {
      sql_command: `
        CREATE OR REPLACE FUNCTION admin_exec_sql(sql_command text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_command;
        END;
        $$;
      `
    })

    if (createFunctionError) {
      console.error('Error al crear la función:', createFunctionError)
      return
    }

    console.log('Función creada exitosamente')

    // Eliminar la restricción única existente
    const { error: dropError } = await supabase.rpc('admin_exec_sql', {
      sql_command: 'ALTER TABLE salas DROP CONSTRAINT IF EXISTS salas_nombre_key;'
    })

    if (dropError) {
      console.error('Error al eliminar la restricción:', dropError)
      return
    }

    console.log('Restricción anterior eliminada exitosamente')

    // Crear la nueva restricción
    const { error: addError } = await supabase.rpc('admin_exec_sql', {
      sql_command: 'ALTER TABLE salas ADD CONSTRAINT salas_nombre_org_unique UNIQUE (nombre, organization_id);'
    })

    if (addError) {
      console.error('Error al crear la nueva restricción:', addError)
      return
    }

    console.log('Nueva restricción creada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

modificarRestriccion() 