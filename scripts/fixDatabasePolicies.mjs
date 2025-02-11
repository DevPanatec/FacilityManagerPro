import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixDatabasePolicies() {
  try {
    console.log('Iniciando corrección de políticas de base de datos...')

    // Función auxiliar para ejecutar SQL
    const executeSQL = async (sql) => {
      const { error } = await supabase.rpc('execute_sql', {
        sql_command: sql
      })
      if (error) throw error
    }

    // 1. Habilitar RLS en todas las tablas
    const enableRLSSQL = `
      ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE area_classifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cleaning_requirements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cleaning_techniques ENABLE ROW LEVEL SECURITY;
      ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE contingencies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
      ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inventory_restock ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inventory_usage ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
      ALTER TABLE subareas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
      ALTER TABLE task_states ENABLE ROW LEVEL SECURITY;
      ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
    `
    await executeSQL(enableRLSSQL)
    console.log('RLS habilitado en todas las tablas')

    // 2. Limpiar políticas duplicadas
    const cleanPoliciesSQL = `
      -- Eliminar todas las políticas existentes de las tablas principales
      DROP POLICY IF EXISTS "Users can view own data" ON users;
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
      DROP POLICY IF EXISTS "Service role has full access" ON users;
      DROP POLICY IF EXISTS "Users can update own profile only" ON users;
      DROP POLICY IF EXISTS "Users can view their own data" ON users;

      DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
      DROP POLICY IF EXISTS "Organizations are viewable by their members" ON organizations;
      DROP POLICY IF EXISTS "Organizations can be created by admins" ON organizations;
      DROP POLICY IF EXISTS "Organizations can be updated by admins" ON organizations;
      DROP POLICY IF EXISTS "Superadmins can manage organizations" ON organizations;

      DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON tasks;
      DROP POLICY IF EXISTS "Tasks are viewable by users" ON tasks;
      DROP POLICY IF EXISTS "Users can create tasks in their organization" ON tasks;
      DROP POLICY IF EXISTS "Users can delete tasks from their organization" ON tasks;
      DROP POLICY IF EXISTS "Users can update tasks from their organization" ON tasks;
    `
    await executeSQL(cleanPoliciesSQL)
    console.log('Políticas duplicadas eliminadas')

    // 3. Crear nuevas políticas optimizadas
    const createPoliciesSQL = `
      -- Políticas para users
      CREATE POLICY "users_base_policy" ON users
      FOR SELECT TO authenticated
      USING (
        id = auth.uid()
        OR
        (
          organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
            AND role IN ('enterprise', 'admin', 'superadmin')
          )
        )
        OR
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
        )
      );

      CREATE POLICY "users_update_policy" ON users
      FOR UPDATE TO authenticated
      USING (
        id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
      );

      -- Políticas para organizations
      CREATE POLICY "organizations_base_policy" ON organizations
      FOR SELECT TO authenticated
      USING (
        id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
        )
      );

      CREATE POLICY "organizations_admin_policy" ON organizations
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
      );

      -- Políticas para tasks
      CREATE POLICY "tasks_base_policy" ON tasks
      FOR SELECT TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );

      CREATE POLICY "tasks_write_policy" ON tasks
      FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('enterprise', 'admin', 'superadmin')
        )
      );

      -- Políticas para inventory
      CREATE POLICY "inventory_base_policy" ON inventory
      FOR SELECT TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );

      CREATE POLICY "inventory_write_policy" ON inventory
      FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('enterprise', 'admin', 'superadmin')
        )
      );
    `
    await executeSQL(createPoliciesSQL)
    console.log('Nuevas políticas creadas exitosamente')

    // 4. Asegurar permisos básicos
    const grantPermissionsSQL = `
      -- Asegurar permisos básicos para usuarios autenticados
      GRANT SELECT ON users TO authenticated;
      GRANT SELECT ON organizations TO authenticated;
      GRANT SELECT ON tasks TO authenticated;
      GRANT SELECT ON inventory TO authenticated;
      GRANT SELECT ON salas TO authenticated;
      GRANT SELECT ON employees TO authenticated;
      GRANT SELECT ON work_shifts TO authenticated;
    `
    await executeSQL(grantPermissionsSQL)
    console.log('Permisos básicos asegurados')

    console.log('Corrección de políticas completada exitosamente')
  } catch (error) {
    console.error('Error al corregir políticas:', error)
  }
}

fixDatabasePolicies() 