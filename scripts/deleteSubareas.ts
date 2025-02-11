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

const deleteSubareas = async () => {
  try {
    console.log('Eliminando subáreas existentes...')

    // Obtener todas las áreas (cubículos) de la sala de Medicina de Varones
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id')
      .eq('sala_id', '96634613-4bdc-4b75-9ea7-37b6c6acbef9') // ID de la sala de Medicina de Varones

    if (areasError) {
      console.error('Error al obtener áreas:', areasError)
      return
    }

    if (!areas || areas.length === 0) {
      console.log('No se encontraron áreas')
      return
    }

    const areaIds = areas.map(area => area.id)

    // Eliminar todas las subáreas de estas áreas
    const { error: deleteError } = await supabase
      .from('subareas')
      .delete()
      .in('area_id', areaIds)

    if (deleteError) {
      console.error('Error al eliminar subáreas:', deleteError)
      return
    }

    console.log('Subáreas eliminadas exitosamente')

  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

deleteSubareas() 