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

const checkSalas = async () => {
  try {
    console.log('Verificando salas existentes...')

    // Obtener todas las salas
    const { data: salas, error: salasError } = await supabase
      .from('salas')
      .select('*')

    if (salasError) {
      console.error('Error al obtener salas:', salasError)
      return
    }

    if (!salas || salas.length === 0) {
      console.log('No hay salas en la base de datos')
      return
    }

    console.log('Salas encontradas:')
    salas.forEach(sala => {
      console.log(`- ${sala.nombre} (ID: ${sala.id}, Org: ${sala.organization_id})`)
    })

  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

checkSalas() 