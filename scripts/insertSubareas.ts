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

const insertSubareas = async () => {
  try {
    // Primero obtenemos el área principal de Medicina de Varones
    const { data: medicinaMenArea, error: areaError } = await supabase
      .from('areas')
      .select('id')
      .eq('organization_id', HOSPITAL_ID)
      .eq('name', 'MEDICINA DE VARONES')
      .single()

    if (areaError) {
      console.error('Error al buscar área de Medicina de Varones:', areaError)
      return
    }

    if (!medicinaMenArea) {
      console.error('No se encontró el área de Medicina de Varones')
      return
    }

    console.log('Área de Medicina de Varones encontrada:', medicinaMenArea)

    // Estructura de los cubículos y sus subáreas
    const cubiculos = Array.from({ length: 6 }, (_, i) => i + 1).map(num => ({
      name: `CUBÍCULO ${num}`,
      subareas: [
        // Crear 6 camas individuales
        ...Array.from({ length: 6 }, (_, j) => ({
          name: `CAMA ${j + 1} - CUBÍCULO ${num}`,
          description: `Cama ${j + 1} para pacientes del cubículo ${num}`
        })),
        {
          name: `BAÑO DE CUBÍCULO ${num}`,
          description: 'Baño del cubículo'
        },
        {
          name: `ESTACIÓN DE ENFERMERÍA - CUBÍCULO ${num}`,
          description: 'Estación de trabajo para enfermería'
        },
        {
          name: `CUARTO SÉPTICO - CUBÍCULO ${num}`,
          description: 'Cuarto para manejo de residuos y material contaminado'
        }
      ]
    }))

    // Crear los cubículos y sus subáreas
    for (const cubiculo of cubiculos) {
      // Crear el cubículo
      const { data: cubiculoArea, error: cubError } = await supabase
        .from('areas')
        .insert({
          name: cubiculo.name,
          organization_id: HOSPITAL_ID,
          parent_id: medicinaMenArea.id,
          status: 'active'
        })
        .select()
        .single()

      if (cubError) {
        console.error(`Error al crear ${cubiculo.name}:`, cubError)
        continue
      }

      console.log(`Cubículo creado: ${cubiculo.name}`)

      // Crear las subáreas del cubículo
      for (const subarea of cubiculo.subareas) {
        const { data: subareaData, error: subError } = await supabase
          .from('areas')
          .insert({
            name: subarea.name,
            description: subarea.description,
            organization_id: HOSPITAL_ID,
            parent_id: cubiculoArea.id,
            status: 'active'
          })
          .select()
          .single()

        if (subError) {
          console.error(`Error al crear ${subarea.name}:`, subError)
          continue
        }

        console.log(`Subárea creada: ${subarea.name}`)
      }
    }

    console.log('Proceso completado')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertSubareas() 