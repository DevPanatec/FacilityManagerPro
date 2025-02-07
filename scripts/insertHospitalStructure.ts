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

// Definir las tareas por tipo de área
const tasksByAreaType = {
  CAMAS: [
    'SE REALIZA HIGIENE DE MANOS Y SE COLOCA EL EQUIPO DE PROTECCIÓN PERSONAL',
    'SE CLASIFICA EL ÁREA SEGÚN EL TIPO DE LIMPIEZA PROFUNDA',
    'SE LIMPIA LA UNIDAD DEL PACIENTE CON AGUA ENJABONADA, CON WAPWALL EN MÉTODO DE FRICCIÓN Y ARRASTRE',
    'SE LIMPIA LAS SUPERFICIES HORIZONTALES DEBEMOS LIMPIARLOS CON UN PAÑO EMBEBIDO DE DESINFECTANTES COMO MESAS, MOBILIARIOS DE MEDICAMENTOS, ESTACIÓN DE ENFERMERÍA, DISPENSADORES DE PAPEL TOALLA E HIGIÉNICO',
    'SE ENJUAGA UNIDAD DE PACIENTE CON AGUA Y SE REALIZA MÉTODO DE FRICCIÓN CON WAPWALL',
    'EL PASILLO INTERNO BARRIDO HÚMEDO, LIMPIEZA Y DESINFECCIÓN CON TÉCNICA ZIGZAG'
  ],
  BANO: [
    'SE REALIZA DESINFECCIÓN DE LA UNIDAD DEL PACIENTE CON VIRU QUAT Y WAPWALL MÉTODO DE FRICCIÓN',
    'SE LIMPIA PISOS CON MÉTODO DE DOS BALDES, BARRIDO HÚMEDO Y TRAPEADO ENJABONADO Y LUEGO ENJUAGAR'
  ],
  ESTACION: [
    'AL ENTRAR AL ÁREA HOSPITALARIA REALIZAMOS LIMPIEZA INICIANDO POR EL TECHO, ELIMINANDO MANCHAS EN CIELO RASO',
    'SE LIMPIA PUERTAS Y PERILLAS CON ATOMIZADOR, WAPWALL Y SEPTIN',
    'SE REALIZA LIMPIEZA DE INODOROS, INCLUYENDO DUCHAS CON CEPILLO, PAÑOS Y DESINFECTANTE Y PAÑO DE MICROFIBRA',
    'SE LIMPIA CORTINAS DE BAÑO Y SI ESTÁ EN MAL ESTADO SE REPORTA AL ENCARGADO DEL SERVICIO SU DEBIDO CAMBIO',
    'SE REALIZA LIMPIEZA DE VENTANAS FIJAS O PERSIANAS, CON PAÑOS DE MICROFIBRA Y CRISTAL MIX',
    'LA SOLUCIÓN DESINFECTANTE SE DEBE PREPARAR EN EL MOMENTO DE USO Y DESCARTAR LUEGO DE 24 HORAS'
  ],
  SEPTICO: [
    'EN LAS ÁREAS DE AISLAMIENTO REALIZAMOS PROCEDIMIENTO CON EQUIPO EXCLUSIVO ADECUADO Y SE INICIA LA LIMPIEZA DE LIMPIO A LO SUCIO'
  ]
}

const insertHospitalStructure = async () => {
  try {
    console.log('Iniciando inserción de estructura del hospital...')

    // Primero obtener el ID del hospital
    const { data: hospital, error: hospitalError } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', '%San Miguel Arcángel%')
      .single()

    if (hospitalError) {
      console.error('Error al buscar el hospital:', hospitalError)
      return
    }

    if (!hospital) {
      console.error('No se encontró el hospital')
      return
    }

    console.log('Hospital encontrado:', hospital)

    // Crear la sala de MEDICINA DE VARONES
    const { data: sala, error: salaError } = await supabase
      .from('areas')
      .insert({
        name: 'MEDICINA DE VARONES',
        organization_id: hospital.id,
        description: 'Sala de medicina para pacientes masculinos',
        status: 'active'
      })
      .select()
      .single()

    if (salaError) {
      console.error('Error al crear sala:', salaError)
      return
    }

    console.log('Sala creada:', sala)

    // Crear los 6 cubículos
    for (let i = 1; i <= 6; i++) {
      // Crear el cubículo
      const { data: cubiculo, error: cubiculoError } = await supabase
        .from('areas')
        .insert({
          name: `CUBÍCULO ${i}`,
          organization_id: hospital.id,
          parent_id: sala.id,
          status: 'active'
        })
        .select()
        .single()

      if (cubiculoError) {
        console.error(`Error al crear cubículo ${i}:`, cubiculoError)
        continue
      }

      console.log(`Cubículo ${i} creado`)

      // Crear las subáreas para este cubículo
      const subareas = [
        {
          nombre: `CAMAS 1 A LA 7 - CUBÍCULO ${i}`,
          descripcion: 'Área de camas para pacientes',
          tipo: 'CAMAS'
        },
        {
          nombre: `BAÑO DE CUBÍCULO ${i}`,
          descripcion: 'Baño del cubículo',
          tipo: 'BANO'
        },
        {
          nombre: `ESTACIÓN DE ENFERMERÍA - CUBÍCULO ${i}`,
          descripcion: 'Estación de trabajo para enfermería',
          tipo: 'ESTACION'
        },
        {
          nombre: `CUARTO SÉPTICO - CUBÍCULO ${i}`,
          descripcion: 'Cuarto para manejo de residuos',
          tipo: 'SEPTICO'
        }
      ]

      // Crear cada subárea y sus tareas
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

        // Crear las tareas para esta subárea
        const tasks = tasksByAreaType[subarea.tipo]
        for (const taskTitle of tasks) {
          const { error: taskError } = await supabase
            .from('tasks')
            .insert({
              title: taskTitle,
              description: 'Tarea de limpieza y desinfección',
              organization_id: hospital.id,
              area_id: cubiculo.id,
              subarea_id: subareaData.id,
              status: 'pending',
              priority: 'medium'
            })

          if (taskError) {
            console.error(`Error al crear tarea "${taskTitle}":`, taskError)
            continue
          }

          console.log(`Tarea creada para ${subarea.nombre}: ${taskTitle.substring(0, 50)}...`)
        }
      }
    }

    console.log('Proceso completado exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertHospitalStructure() 