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

const migrateToSubareas = async () => {
  try {
    console.log('Iniciando migración a subareas...')

    // Obtener todas las áreas que son subáreas (tienen parent_id)
    const { data: subareas, error: fetchError } = await supabase
      .from('areas')
      .select('*')
      .eq('organization_id', HOSPITAL_ID)
      .not('parent_id', 'is', null)

    if (fetchError) {
      console.error('Error al obtener subáreas:', fetchError)
      return
    }

    if (!subareas || subareas.length === 0) {
      console.log('No se encontraron subáreas para migrar')
      return
    }

    console.log(`Se encontraron ${subareas.length} subáreas para migrar`)

    // Primero, crear todas las subáreas en la nueva tabla
    const migratedIds: string[] = []
    
    for (const subarea of subareas) {
      // Insertar en la nueva tabla subareas
      const { data: newSubarea, error: insertError } = await supabase
        .from('subareas')
        .insert({
          nombre: subarea.name,
          descripcion: subarea.description,
          area_id: subarea.parent_id,
        })
        .select()
        .single()

      if (insertError) {
        console.error(`Error al migrar subárea ${subarea.name}:`, insertError)
        continue
      }

      console.log(`Migrada subárea: ${subarea.name}`)
      migratedIds.push(subarea.id)
    }

    // Después de migrar todas, eliminar las subáreas de la tabla areas
    if (migratedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('areas')
        .delete()
        .in('id', migratedIds)

      if (deleteError) {
        console.error('Error al eliminar subáreas de areas:', deleteError)
      } else {
        console.log(`Eliminadas ${migratedIds.length} subáreas de la tabla areas`)
      }
    }

    console.log('Migración completada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

migrateToSubareas() 