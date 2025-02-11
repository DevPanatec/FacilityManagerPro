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

async function fixUsersPolicies() {
  try {
    console.log('Aplicando corrección a las políticas de usuarios...')

    // Ejecutar las correcciones directamente
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Eliminar todas las políticas existentes
        DROP POLICY IF EXISTS "Users can view own data" ON users;
        DROP POLICY IF EXISTS "Users can update own data" ON users;
        DROP POLICY IF EXISTS "Users can insert users" ON users;
        DROP POLICY IF EXISTS "Users are viewable by organization members" ON users;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
        DROP POLICY IF EXISTS "Service role has full access" ON users;

        -- Asegurar que RLS está habilitado
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Política para service_role
        CREATE POLICY "Service role has full access" ON users
        FOR ALL
        USING (auth.jwt()->>'role' = 'service_role')
        WITH CHECK (auth.jwt()->>'role' = 'service_role');

        -- Política para ver usuarios
        CREATE POLICY "Users can view own data and organization"
        ON users FOR SELECT
        TO authenticated
        USING (
          -- Usuario puede ver su propia información
          id = auth.uid()
          OR
          -- Usuario puede ver otros usuarios de su organización si tiene el rol adecuado
          (
            EXISTS (
              SELECT 1 FROM users u
              WHERE u.id = auth.uid()
              AND u.organization_id = users.organization_id
              AND u.role IN ('enterprise', 'admin', 'superadmin')
            )
          )
          OR
          -- Superadmin puede ver todos los usuarios
          EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'superadmin'
          )
        );

        -- Política para actualizar usuarios
        CREATE POLICY "Users can update own data or admins can update"
        ON users FOR UPDATE
        TO authenticated
        USING (
          id = auth.uid()
          OR
          EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'superadmin')
          )
        );

        -- Política para insertar usuarios
        CREATE POLICY "Admins can insert users"
        ON users FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'superadmin')
          )
        );

        -- Asegurar permisos básicos
        GRANT SELECT ON users TO authenticated;
      `
    })

    if (error) {
      console.error('Error al aplicar las correcciones:', error)
      return
    }

    console.log('Políticas de usuarios corregidas exitosamente')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

fixUsersPolicies() 