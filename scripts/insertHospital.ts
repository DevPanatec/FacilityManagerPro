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

const insertHospital = async () => {
  try {
    // Primero verificamos si el hospital ya existe
    const { data: existingHospitals, error: searchError } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', '%San Miguel Arcángel%')

    if (searchError) {
      console.error('Error al buscar el hospital:', searchError)
      return
    }

    if (existingHospitals && existingHospitals.length > 0) {
      console.log('El hospital ya existe:', existingHospitals[0])
      return
    }

    // Si no existe, lo insertamos
    const { data: newHospital, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: 'Hospital San Miguel Arcángel',
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error al insertar el hospital:', insertError)
      return
    }

    console.log('Hospital insertado exitosamente:', newHospital)
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

insertHospital() 