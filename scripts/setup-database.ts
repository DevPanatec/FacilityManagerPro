import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variables de entorno de Supabase no configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const validateConnection = async () => {
  try {
    console.log('Validando conexión a Supabase...')
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    if (error) throw error

    console.log('✅ Conexión exitosa a Supabase')
    return true
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    return false
  }
}

const applyMigrations = async () => {
  try {
    console.log('Aplicando migraciones...')
    
    // Leer archivos de migración
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      console.log(`\nAplicando migración: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.error(`❌ Error en migración ${file}:`, error)
        continue
      }
      
      console.log(`✅ Migración ${file} aplicada correctamente`)
    }

    console.log('\n✅ Todas las migraciones procesadas')
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error)
  }
}

const setup = async () => {
  const isConnected = await validateConnection()
  if (!isConnected) {
    console.error('❌ No se pudo establecer conexión con Supabase')
    return
  }

  await applyMigrations()
}

setup() 