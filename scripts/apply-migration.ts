import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function applyMigration() {
  try {
    console.log('Aplicando migración...')

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240330000005_convert_medicina_varones.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Error al aplicar la migración:', error)
      process.exit(1)
    }

    console.log('Migración aplicada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
    process.exit(1)
  }
}

applyMigration() 