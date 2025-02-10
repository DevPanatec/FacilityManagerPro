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

const eliminarSala = async () => {
  try {
    const salaId = '6136144b-6fbf-4902-bba4-1302607a1958' // ID de la sala anterior

    // Eliminar la sala
    const { error: errorEliminacion } = await supabase
      .from('salas')
      .delete()
      .eq('id', salaId)

    if (errorEliminacion) {
      console.error('Error al eliminar la sala:', errorEliminacion)
      return
    }

    console.log('Sala eliminada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

eliminarSala() 