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

const insertarSala = async () => {
  try {
    const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799'
    const nombreSala = 'MEDICINA DE VARONES - HSMA'

    // Verificamos si ya existe una sala con ese nombre en esa organización
    const { data: salasExistentes, error: errorBusqueda } = await supabase
      .from('salas')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('nombre', nombreSala)

    if (errorBusqueda) {
      console.error('Error al buscar la sala:', errorBusqueda)
      return
    }

    if (salasExistentes && salasExistentes.length > 0) {
      console.log('Ya existe una sala con ese nombre en esta organización:', salasExistentes[0])
      return salasExistentes[0]
    }

    // Si no existe, insertamos la nueva sala
    const { data: nuevaSala, error: errorInsercion } = await supabase
      .from('salas')
      .insert([{
        nombre: nombreSala,
        descripcion: 'Sala de medicina para pacientes masculinos del Hospital San Miguel Arcángel',
        organization_id: organizationId
      }])
      .select()

    if (errorInsercion) {
      console.error('Error al insertar la sala:', errorInsercion)
      return
    }

    console.log('Sala insertada exitosamente:', nuevaSala)
    return nuevaSala
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertarSala() 