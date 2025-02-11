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

const tareas = [
  'SE REALIZA HIGIENE DE MANOS Y SE COLOCA EL EQUIPO DE PROTECCIÓN PERSONAL',
  'SE CUMPLE EL AREA SEGÚN EL TIPO DE LIMPIEZA PROFUNDA',
  'SE LIMPIA LA UNIDAD DEL PACIENTE CON AGUA ENJABONADA, CON WAYPALL EN MÉTODO DE FRICCIÓN Y ARRASTRE',
  'SE LIMPIA LAS SUPERFICIES HORIZONTALES DEBEMOS LIMPIARLOS CON PAÑO HÚMEDO DE DESINFECTANTE MESAS, MOBILIARIOS DE MEDICAMENTOS , ESTACION DE ENFERMERIA, DISPENSADORES DE PAPEL TOALLA E HIGIENICO',
  'SE LIMPIA UNIDAD DE PACIENTE CON AGUA Y SE REALIZA METODO DE FRICCION CON WAYPALL',
  'EL PASILLO INTERNO BARRIDO HÚMEDO, LIMPIEZA Y DESINFECCIÓN CON TÉCNICA ZIGZAG',
  'SE REALIZA DESINFECCION DE LA UNIDAD DEL PACIENTE CON VIRU QUAT Y WAYPALL METODO DE FRICCION',
  'SE LIMPIA PISOS CON METODO DE DOS BALDES, BARRIDO HÚMEDO Y TRAPEADO ENJABONADO Y LUEGO ENJUAGAR',
  'AL ENTRAR AL AREA HOSPITALARIA REALIZAMOS LIMPIEZA INICIANDO POR EL TECHO, ELIMINANDO MANCHAS EN CIELO RASO',
  'SE LIMPIA PUERTAS Y PERILLAS CON ATOMIZADOR, WAYPALL Y SEPTIN',
  'SE REALIZA LIMPIEZA DE INODOROS INCLUYENDO DUCHAS CON CEPILLO PAÑOS Y DESINFECTANTE Y PAÑO DE MICROFIBRA',
  'SE LIMPIA CORTINAS DE BAÑO Y SI ESTA EN MAL ESTADO SE REPORTA AL SUPERVISOR PARA CAMBIO SU DEBIDO CAMBIO',
  'SE REALIZA LIMPIEZA DE VENTANAS FIJAS O PERSIANAS CON PAÑOS DE MICROFIBRA Y CRYSTAL MIX',
  'LA SOLUCION DESINFECTANTE SE DEBE PREPARAR EN EL MOMENTO Y DEBE SER DESCARTADA LUEGO DE 24 HORAS',
  'EN LAS AREAS DE AISLAMIENTO REALIZAMOS PROCEDIMIENTO CON EQUIPO EXCLUSIVO ADECUADO Y SE INICIA LA LIMPIEZA DE LIMPIO A LO SUCIO'
].map((description, index) => ({
  title: `Paso ${index + 1}`,
  description,
  organization_id: 'e7ddbbd4-a30f-403c-b219-d9660014a799'
}))

const insertarTareas = async () => {
  try {
    // Insertar todas las tareas
    const { data: tareasInsertadas, error: errorInsercion } = await supabase
      .from('tasks')
      .insert(tareas)
      .select()

    if (errorInsercion) {
      console.error('Error al insertar las tareas:', errorInsercion)
      return
    }

    console.log('Tareas insertadas exitosamente:', tareasInsertadas)
    console.log(`Se insertaron ${tareasInsertadas.length} tareas`)
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertarTareas() 