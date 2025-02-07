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

const deleteAreas = async () => {
  try {
    console.log('Iniciando eliminación de áreas...')

    // Primero obtener todas las áreas del hospital
    const { data: areas, error: fetchError } = await supabase
      .from('areas')
      .select('id, name')
      .eq('organization_id', HOSPITAL_ID)

    if (fetchError) {
      console.error('Error al obtener áreas:', fetchError)
      return
    }

    if (!areas || areas.length === 0) {
      console.log('No se encontraron áreas para eliminar')
      return
    }

    console.log(`Se encontraron ${areas.length} áreas para eliminar`)

    // Eliminar todas las áreas
    const { error: deleteError } = await supabase
      .from('areas')
      .delete()
      .eq('organization_id', HOSPITAL_ID)

    if (deleteError) {
      console.error('Error al eliminar áreas:', deleteError)
      return
    }

    console.log('Todas las áreas han sido eliminadas exitosamente')
    
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

deleteAreas() 