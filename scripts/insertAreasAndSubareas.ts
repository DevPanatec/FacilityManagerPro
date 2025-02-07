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

const HOSPITAL_ID = '3bd90128-4453-4b75-9861-9c4a6f270dfa'

const insertAreasAndSubareas = async () => {
  try {
    console.log('Iniciando inserción de áreas y subáreas...')

    // Primero buscar la sala de Medicina de Varones
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select()
      .eq('nombre', 'MEDICINA DE VARONES')
      .eq('organization_id', HOSPITAL_ID)
      .single()

    if (salaError) {
      console.error('Error al buscar sala:', salaError)
      return
    }

    if (!sala) {
      console.error('No se encontró la sala de Medicina de Varones')
      return
    }

    console.log('Sala encontrada:', sala)

    // Crear los 6 cubículos
    for (let i = 1; i <= 6; i++) {
      // Crear el cubículo en la tabla areas
      const { data: cubiculo, error: cubError } = await supabase
        .from('areas')
        .insert({
          name: `CUBÍCULO ${i}`,
          organization_id: HOSPITAL_ID,
          sala_id: sala.id,
          status: 'active'
        })
        .select()
        .single()

      if (cubError) {
        console.error(`Error al crear Cubículo ${i}:`, cubError)
        continue
      }

      console.log(`Cubículo ${i} creado`)

      // Crear las subáreas para este cubículo
      const subareas = [
        // Crear 7 camas individuales
        ...Array.from({ length: 7 }, (_, j) => ({
          nombre: `CAMA ${j + 1} - CUBÍCULO ${i}`,
          descripcion: `Cama ${j + 1} para pacientes del cubículo ${i}`
        })),
        {
          nombre: `BAÑO DE CUBÍCULO ${i}`,
          descripcion: 'Baño del cubículo'
        },
        {
          nombre: `ESTACIÓN DE ENFERMERÍA - CUBÍCULO ${i}`,
          descripcion: 'Estación de trabajo para enfermería'
        },
        {
          nombre: `CUARTO SÉPTICO - CUBÍCULO ${i}`,
          descripcion: 'Cuarto para manejo de residuos'
        }
      ]

      // Crear cada subárea en la tabla subareas
      for (const subarea of subareas) {
        const { data: subareaData, error: subareaError } = await supabase
          .from('subareas')
          .insert({
            nombre: subarea.nombre,
            descripcion: subarea.descripcion,
            area_id: cubiculo.id
          })
          .select()
          .single()

        if (subareaError) {
          console.error(`Error al crear subárea ${subarea.nombre}:`, subareaError)
          continue
        }

        console.log(`Subárea creada: ${subarea.nombre}`)
      }
    }

    console.log('Proceso completado exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertAreasAndSubareas() 