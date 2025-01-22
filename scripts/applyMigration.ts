import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function applyMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Faltan las variables de entorno necesarias')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Leer el archivo de migración
    const migrationSQL = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/20240320000001_salas_policies.sql'),
        'utf8'
    )
    
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', {
        query: migrationSQL
    })
    
    if (error) {
        console.error('Error aplicando la migración:', error)
        throw error
    }
    
    console.log('Migración aplicada correctamente')
}

// Ejecutar la migración
applyMigration()
    .catch(console.error) 