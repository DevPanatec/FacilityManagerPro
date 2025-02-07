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

const deleteOldSubareas = async () => {
  try {
    console.log('Eliminando subáreas antiguas...')

    // Eliminar las subáreas que contienen "CAMAS 1 A LA 7"
    const { data: deletedSubareas, error: deleteError } = await supabase
      .from('subareas')
      .delete()
      .like('nombre', '%CAMAS 1 A LA 7%')
      .select()

    if (deleteError) {
      console.error('Error al eliminar subáreas:', deleteError)
      return
    }

    if (deletedSubareas) {
      console.log(`Se eliminaron ${deletedSubareas.length} subáreas antiguas:`)
      deletedSubareas.forEach(subarea => {
        console.log(`- ${subarea.nombre}`)
      })
    }

    console.log('Proceso completado')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

deleteOldSubareas() 