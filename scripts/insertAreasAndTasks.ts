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

// Definir las tareas comunes para cada tipo de área
const commonTasks = {
  camas: [
    'SE REALIZA HIGIENE DE MANOS Y SE COLOCA EL EQUIPO DE PROTECCIÓN PERSONAL',
    'SE CLASIFICA EL ÁREA SEGÚN EL TIPO DE LIMPIEZA PROFUNDA',
    'SE LIMPIA LA UNIDAD DEL PACIENTE CON AGUA ENJABONADA, CON WAPWALL EN MÉTODO DE FRICCIÓN Y ARRASTRE',
    'SE LIMPIAN LAS SUPERFICIES HORIZONTALES DEBEMOS LIMPIARLOS CON UN PAÑO EMBEBIDO DE DESINFECTANTES COMO MESAS, MOBILIARIOS DE MEDICAMENTOS, ESTACIÓN DE ENFERMERÍA, DISPENSADORES DE PAPEL TOALLA E HIGIÉNICO',
    'SE ENJUAGA UNIDAD DE PACIENTE CON AGUA Y SE REALIZA MÉTODO DE FRICCIÓN CON WAPWALL',
    'EL PASILLO INTERNO BARRIDO HÚMEDO, LIMPIEZA Y DESINFECCIÓN CON TÉCNICA ZIGZAG'
  ],
  bano: [
    'SE REALIZA DESINFECCIÓN DE LA UNIDAD DEL PACIENTE CON VIRU QUAT Y WAPWALL MÉTODO DE FRICCIÓN',
    'SE LIMPIA PISO CON MÉTODO DE DOS BALDES, BARRIDO HÚMEDO Y TRAPEADO ENJABONADO Y LUEGO ENJUAGAR'
  ],
  estacion: [
    'AL ENTRAR AL ÁREA HOSPITALARIA REALIZAMOS LIMPIEZA INICIANDO POR EL TECHO, ELIMINANDO MANCHAS EN CIELO RASO',
    'SE LIMPIA PUERTAS Y PERILLAS CON ATOMIZADOR, WAPWALL Y SEPTIN',
    'SE REALIZA LIMPIEZA DE INODOROS, INCLUYENDO DUCHAS CON CEPILLO, PAÑOS Y DESINFECTANTE Y PAÑO DE MICROFIBRA',
    'SE LIMPIA CORTINAS DE BAÑO Y SI ESTÁ EN MAL ESTADO SE REPORTA AL ENCARGADO DEL SERVICIO SU DEBIDO CAMBIO',
    'SE REALIZA LIMPIEZA DE VENTANAS FIJAS O PERSIANAS CON PAÑOS DE MICROFIBRA Y CRISTAL MIX',
    'LA SOLUCIÓN DESINFECTANTE SE DEBE PREPARAR EN EL MOMENTO DE USO Y DESCARTAR LUEGO DE 24 HORAS'
  ],
  cuartoSeptico: [
    'EN LAS ÁREAS DE AISLAMIENTO REALIZAMOS PROCEDIMIENTO CON EQUIPO EXCLUSIVO ADECUADO Y SE INICIA LA LIMPIEZA DE LIMPIO A LO SUCIO'
  ]
}

const insertAreasAndTasks = async () => {
  try {
    console.log('Iniciando inserción de áreas y tareas...')

    // Primero crear el área principal de Medicina de Varones
    const { data: medicinaMenArea, error: mainAreaError } = await supabase
      .from('areas')
      .insert({
        name: 'MEDICINA DE VARONES',
        organization_id: HOSPITAL_ID,
        description: 'Área de medicina para pacientes masculinos',
        status: 'active'
      })
      .select()
      .single()

    if (mainAreaError) {
      console.error('Error al crear área principal:', mainAreaError)
      return
    }

    console.log('Área principal creada:', medicinaMenArea)

    // Crear los 6 cubículos con sus subáreas
    for (let i = 1; i <= 6; i++) {
      // Crear el cubículo
      const { data: cubiculo, error: cubError } = await supabase
        .from('areas')
        .insert({
          name: `CUBÍCULO ${i}`,
          organization_id: HOSPITAL_ID,
          parent_id: medicinaMenArea.id,
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
        {
          name: `CAMAS 1 A LA 7 - CUBÍCULO ${i}`,
          description: 'Área de camas para pacientes',
          tasks: commonTasks.camas
        },
        {
          name: `BAÑO DE CUBÍCULO ${i}`,
          description: 'Baño del cubículo',
          tasks: commonTasks.bano
        },
        {
          name: `ESTACIÓN DE ENFERMERÍA - CUBÍCULO ${i}`,
          description: 'Estación de trabajo para enfermería',
          tasks: commonTasks.estacion
        },
        {
          name: `CUARTO SÉPTICO - CUBÍCULO ${i}`,
          description: 'Cuarto para manejo de residuos',
          tasks: commonTasks.cuartoSeptico
        }
      ]

      // Crear cada subárea y sus tareas
      for (const subarea of subareas) {
        const { data: subareaData, error: subareaError } = await supabase
          .from('areas')
          .insert({
            name: subarea.name,
            description: subarea.description,
            organization_id: HOSPITAL_ID,
            parent_id: cubiculo.id,
            status: 'active'
          })
          .select()
          .single()

        if (subareaError) {
          console.error(`Error al crear ${subarea.name}:`, subareaError)
          continue
        }

        console.log(`Subárea creada: ${subarea.name}`)

        // Crear las tareas para esta subárea
        for (const taskTitle of subarea.tasks) {
          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              title: taskTitle,
              description: 'Tarea de limpieza y desinfección',
              organization_id: HOSPITAL_ID,
              area_id: subareaData.id,
              status: 'pending',
              priority: 'medium'
            })

          if (taskError) {
            console.error(`Error al crear tarea "${taskTitle}":`, taskError)
            continue
          }

          console.log(`Tarea creada para ${subarea.name}: ${taskTitle.substring(0, 50)}...`)
        }
      }
    }

    console.log('Proceso completado exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertAreasAndTasks() 