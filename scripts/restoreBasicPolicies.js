import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const restoreBasicPolicies = async () => {
  try {
    console.log('Restaurando políticas básicas...')

    // Leer el archivo SQL
    const sqlPath = resolve(__dirname, '../supabase/migrations/20240329000029_restore_basic_policies.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    // Ejecutar el SQL usando la API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        sql_command: sql
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error ejecutando SQL:', error)
      return
    }

    console.log('Políticas básicas restauradas exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

restoreBasicPolicies() 