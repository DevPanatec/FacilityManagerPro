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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const eliminarTareas = async () => {
  try {
    // Primero verificamos cuántas tareas hay
    const { count, error: errorConteo } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    if (errorConteo) {
      console.error('Error al contar las tareas:', errorConteo)
      return
    }

    console.log(`Se encontraron ${count} tareas para eliminar`)

    // Eliminar todas las tareas usando delete sin condiciones
    const { error: errorEliminacion } = await supabase
      .from('tasks')
      .delete()
      .gt('id', '00000000-0000-0000-0000-000000000000')

    if (errorEliminacion) {
      console.error('Error al eliminar las tareas:', errorEliminacion)
      return
    }

    console.log('Todas las tareas han sido eliminadas exitosamente')

    // Verificar que se hayan eliminado todas
    const { count: countFinal, error: errorVerificacion } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    if (errorVerificacion) {
      console.error('Error al verificar la eliminación:', errorVerificacion)
      return
    }

    console.log(`Quedan ${countFinal} tareas en la tabla`)
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

eliminarTareas() 