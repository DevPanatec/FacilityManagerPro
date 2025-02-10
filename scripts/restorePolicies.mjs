import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function restorePolicies() {
  try {
    // Restaurar políticas básicas para users
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql_command: `
        DROP POLICY IF EXISTS "Users can view own data" ON users;
        CREATE POLICY "Users can view own data"
        ON users FOR SELECT
        TO authenticated
        USING (
            id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                AND u.role = 'enterprise'
                AND u.organization_id = users.organization_id
            )
            OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                AND u.role IN ('admin', 'superadmin')
                AND u.organization_id = users.organization_id
            )
        );
      `
    })
    
    if (usersError) throw usersError

    // Restaurar políticas para organizations
    const { error: orgsError } = await supabase.rpc('execute_sql', {
      sql_command: `
        DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
        CREATE POLICY "Organizations are viewable by members"
        ON organizations FOR SELECT
        TO authenticated
        USING (
            id IN (
                SELECT organization_id FROM users
                WHERE id = auth.uid()
            )
        );
      `
    })
    
    if (orgsError) throw orgsError

    // Restaurar políticas para salas
    const { error: salasError } = await supabase.rpc('execute_sql', {
      sql_command: `
        DROP POLICY IF EXISTS "Salas are viewable by organization members" ON salas;
        CREATE POLICY "Salas are viewable by organization members"
        ON salas FOR SELECT
        TO authenticated
        USING (
            organization_id IN (
                SELECT organization_id FROM users
                WHERE id = auth.uid()
            )
        );
      `
    })
    
    if (salasError) throw salasError

    // Restaurar políticas para tasks
    const { error: tasksError } = await supabase.rpc('execute_sql', {
      sql_command: `
        DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;
        CREATE POLICY "Tasks are viewable by organization members"
        ON tasks FOR SELECT
        TO authenticated
        USING (
            organization_id IN (
                SELECT organization_id FROM users
                WHERE id = auth.uid()
            )
        );
      `
    })
    
    if (tasksError) throw tasksError

    // Habilitar RLS y permisos básicos
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql_command: `
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

        GRANT SELECT ON users TO authenticated;
        GRANT SELECT ON organizations TO authenticated;
        GRANT SELECT ON salas TO authenticated;
        GRANT SELECT ON tasks TO authenticated;
      `
    })
    
    if (rlsError) throw rlsError

    console.log('Políticas restauradas exitosamente')
  } catch (error) {
    console.error('Error al restaurar políticas:', error)
  }
}

restorePolicies() 