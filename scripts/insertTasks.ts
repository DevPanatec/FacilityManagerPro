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

type AreaType = 'CAMAS' | 'BAÑO' | 'ESTACIÓN' | 'SÉPTICO'
type TasksByAreaType = Record<AreaType, string[]>

// Definir las tareas por tipo de área
const tasksByAreaType: TasksByAreaType = {
  'CAMAS': [
    'SE REALIZA HIGIENE DE MANOS Y SE COLOCA EL EQUIPO DE PROTECCIÓN PERSONAL',
    'SE CLASIFICA EL ÁREA SEGÚN EL TIPO DE LIMPIEZA PROFUNDA',
    'SE LIMPIA LA UNIDAD DEL PACIENTE CON AGUA ENJABONADA, CON WAPWALL EN MÉTODO DE FRICCIÓN Y ARRASTRE',
    'SE LIMPIA LAS SUPERFICIES HORIZONTALES DEBEMOS LIMPIARLOS CON UN PAÑO EMBEBIDO DE DESINFECTANTES COMO MESAS, MOBILIARIOS DE MEDICAMENTOS, ESTACIÓN DE ENFERMERÍA, DISPENSADORES DE PAPEL TOALLA E HIGIÉNICO',
    'SE ENJUAGA UNIDAD DE PACIENTE CON AGUA Y SE REALIZA MÉTODO DE FRICCIÓN CON WAPWALL',
    'EL PASILLO INTERNO BARRIDO HÚMEDO, LIMPIEZA Y DESINFECCIÓN CON TÉCNICA ZIGZAG'
  ],
  'BAÑO': [
    'SE REALIZA DESINFECCIÓN DE LA UNIDAD DEL PACIENTE CON VIRU QUAT Y WAPWALL MÉTODO DE FRICCIÓN',
    'SE LIMPIA PISOS CON MÉTODO DE DOS BALDES, BARRIDO HÚMEDO Y TRAPEADO ENJABONADO Y LUEGO ENJUAGAR'
  ],
  'ESTACIÓN': [
    'AL ENTRAR AL ÁREA HOSPITALARIA REALIZAMOS LIMPIEZA INICIANDO POR EL TECHO, ELIMINANDO MANCHAS EN CIELO RASO',
    'SE LIMPIA PUERTAS Y PERILLAS CON ATOMIZADOR, WAPWALL Y SEPTIN',
    'SE REALIZA LIMPIEZA DE INODOROS, INCLUYENDO DUCHAS CON CEPILLO, PAÑOS Y DESINFECTANTE Y PAÑO DE MICROFIBRA',
    'SE LIMPIA CORTINAS DE BAÑO Y SI ESTÁ EN MAL ESTADO SE REPORTA AL ENCARGADO DEL SERVICIO SU DEBIDO CAMBIO',
    'SE REALIZA LIMPIEZA DE VENTANAS FIJAS O PERSIANAS CON PAÑOS DE MICROFIBRA Y CRISTAL MIX',
    'LA SOLUCIÓN DESINFECTANTE SE DEBE PREPARAR EN EL MOMENTO DE USO Y DESCARTAR LUEGO DE 24 HORAS'
  ],
  'SÉPTICO': [
    'EN LAS ÁREAS DE AISLAMIENTO REALIZAMOS PROCEDIMIENTO CON EQUIPO EXCLUSIVO ADECUADO Y SE INICIA LA LIMPIEZA DE LIMPIO A LO SUCIO'
  ]
}

interface Area {
  id: string
  name: string
  organization_id: string
}

const insertTasks = async () => {
  try {
    // Obtener todas las áreas del hospital
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('*')
      .eq('organization_id', HOSPITAL_ID)

    if (areasError) {
      console.error('Error al obtener áreas:', areasError)
      return
    }

    if (!areas) {
      console.error('No se encontraron áreas')
      return
    }

    // Procesar cada área
    for (const area of areas) {
      let tasksToInsert: string[] = []

      // Determinar qué tipo de área es y asignar sus tareas
      if (area.name.includes('CAMAS')) {
        tasksToInsert = tasksByAreaType['CAMAS']
      } else if (area.name.includes('BAÑO')) {
        tasksToInsert = tasksByAreaType['BAÑO']
      } else if (area.name.includes('ESTACIÓN')) {
        tasksToInsert = tasksByAreaType['ESTACIÓN']
      } else if (area.name.includes('SÉPTICO')) {
        tasksToInsert = tasksByAreaType['SÉPTICO']
      }

      // Insertar las tareas para esta área
      for (const taskTitle of tasksToInsert) {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            organization_id: HOSPITAL_ID,
            area_id: area.id,
            title: taskTitle,
            description: 'Tarea de limpieza y desinfección',
            status: 'pending',
            priority: 'medium'
          })
          .select()
          .single()

        if (taskError) {
          console.error(`Error al crear tarea "${taskTitle}" para área ${area.name}:`, taskError)
          continue
        }

        console.log(`Tarea creada para ${area.name}: ${taskTitle}`)
      }
    }

    console.log('Proceso de creación de tareas completado')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertTasks() 