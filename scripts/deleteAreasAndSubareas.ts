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

const HOSPITAL_ID = 'e7ddbbd4-a30f-403c-b219-d9660014a799'

const deleteAreasAndSubareas = async () => {
  try {
    console.log('Iniciando eliminación de áreas y subáreas...')

    // Primero obtener todas las áreas del hospital
    const { data: areas, error: fetchError } = await supabase
      .from('areas')
      .select('id')
      .eq('organization_id', HOSPITAL_ID)

    if (fetchError) {
      console.error('Error al obtener áreas:', fetchError)
      return
    }

    if (!areas || areas.length === 0) {
      console.log('No se encontraron áreas para eliminar')
      return
    }

    const areaIds = areas.map(area => area.id)

    // Eliminar todas las subáreas asociadas a estas áreas
    const { error: subareasError } = await supabase
      .from('subareas')
      .delete()
      .in('area_id', areaIds)

    if (subareasError) {
      console.error('Error al eliminar subáreas:', subareasError)
      return
    }

    console.log('Subáreas eliminadas exitosamente')

    // Luego eliminar todas las áreas del hospital
    const { error: areasError } = await supabase
      .from('areas')
      .delete()
      .eq('organization_id', HOSPITAL_ID)

    if (areasError) {
      console.error('Error al eliminar áreas:', areasError)
      return
    }

    console.log('Áreas eliminadas exitosamente')
    console.log('Proceso completado')

  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

deleteAreasAndSubareas() 