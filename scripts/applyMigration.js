import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env.local') })

// Verificar variables de entorno
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('Aplicando migración...')
    
    // Leer el archivo SQL
    const sqlFile = join(__dirname, '../supabase/migrations/20240331000002_fix_chat_recursion.sql')
    const sqlContent = readFileSync(sqlFile, 'utf8')
    
    // Dividir el contenido en statements individuales
    const statements = sqlContent.split(';').filter(stmt => stmt.trim())
    
    // Ejecutar cada statement por separado
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('execute_sql', {
          query: statement.trim()
        })
        
        if (error) {
          console.error('Error ejecutando statement:', error)
          console.error('Statement:', statement.trim())
          throw error
        }
      }
    }
    
    console.log('Migración aplicada exitosamente')
  } catch (error) {
    console.error('Error al aplicar la migración:', error)
  }
}

applyMigration() 