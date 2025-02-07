import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const fixChatRooms = async () => {
  try {
    console.log('Aplicando corrección a la función get_user_chat_rooms...')
    
    // Leer el archivo SQL
    const sqlFile = path.resolve(process.cwd(), 'supabase/migrations/20240330000002_fix_chat_rooms_function.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error aplicando corrección:', error)
      return
    }

    console.log('Corrección aplicada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

fixChatRooms() 