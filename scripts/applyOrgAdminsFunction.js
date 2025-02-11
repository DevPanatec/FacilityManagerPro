import fetch from 'node-fetch'
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

const applyFunction = async () => {
  try {
    console.log('Aplicando función get_org_admins...')

    // Leer el archivo SQL
    const sqlPath = resolve(__dirname, '../supabase/migrations/20240208000003_fix_org_admins_function.sql')
    const sql = readFileSync(sqlPath, 'utf8')

    // Ejecutar el SQL usando la API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        sql_query: sql
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error ejecutando SQL:', error)
      return
    }

    console.log('Función aplicada exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

applyFunction() 