import { exec } from 'child_process'
import { promisify } from 'util'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { writeFileSync, unlinkSync } from 'fs'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const setupChatFunctions = async () => {
  try {
    console.log('Configurando funciones del chat...')

    // Crear archivo SQL temporal
    const sqlFile = resolve(__dirname, 'temp_migration.sql')
    const sql = `
      -- 1. Crear función get_user_chat_rooms
      CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
      RETURNS TABLE (
          room_id UUID,
          room_name TEXT,
          room_type TEXT,
          room_description TEXT,
          organization_id UUID,
          created_by UUID,
          created_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ,
          last_message JSONB,
          unread_count BIGINT,
          members JSONB
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
          RETURN QUERY
          WITH last_messages AS (
              SELECT DISTINCT ON (cm.room_id)
                  cm.room_id,
                  jsonb_build_object(
                      'id', cm.id,
                      'content', cm.content,
                      'created_at', cm.created_at,
                      'user_id', cm.user_id
                  ) as message,
                  cm.created_at
              FROM chat_messages cm
              ORDER BY cm.room_id, cm.created_at DESC
          ),
          unread_counts AS (
              SELECT 
                  crm.room_id,
                  COUNT(cm.id) as count
              FROM chat_room_members crm
              LEFT JOIN chat_messages cm ON cm.room_id = crm.room_id
              WHERE crm.user_id = p_user_id
              AND cm.created_at > COALESCE(crm.last_read_at, '1970-01-01'::timestamp)
              GROUP BY crm.room_id
          ),
          room_members AS (
              SELECT 
                  crm.room_id,
                  jsonb_agg(
                      jsonb_build_object(
                          'user_id', u.id,
                          'email', u.email,
                          'first_name', u.first_name,
                          'last_name', u.last_name,
                          'role', crm.role
                      )
                  ) as members
              FROM chat_room_members crm
              JOIN users u ON u.id = crm.user_id
              GROUP BY crm.room_id
          )
          SELECT 
              cr.id as room_id,
              cr.name as room_name,
              cr.type as room_type,
              cr.description as room_description,
              cr.organization_id,
              cr.created_by,
              cr.created_at,
              cr.updated_at,
              lm.message as last_message,
              COALESCE(uc.count, 0) as unread_count,
              COALESCE(rm.members, '[]'::jsonb) as members
          FROM chat_rooms cr
          JOIN chat_room_members crm ON crm.room_id = cr.id
          LEFT JOIN last_messages lm ON lm.room_id = cr.id
          LEFT JOIN unread_counts uc ON uc.room_id = cr.id
          LEFT JOIN room_members rm ON rm.room_id = cr.id
          WHERE crm.user_id = p_user_id
          AND crm.status = 'active'
          ORDER BY COALESCE(lm.created_at, cr.created_at) DESC;
      END;
      $$;

      -- 2. Configurar permisos y políticas
      GRANT EXECUTE ON FUNCTION get_user_chat_rooms(UUID) TO authenticated;

      -- Políticas para chat_rooms
      DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
      CREATE POLICY "Users can view their own chat rooms"
      ON chat_rooms
      FOR SELECT
      USING (
          EXISTS (
              SELECT 1 FROM chat_room_members
              WHERE room_id = id
              AND user_id = auth.uid()
              AND status = 'active'
          )
      );

      -- Políticas para chat_room_members
      DROP POLICY IF EXISTS "Users can view members of their chat rooms" ON chat_room_members;
      CREATE POLICY "Users can view members of their chat rooms"
      ON chat_room_members
      FOR SELECT
      USING (
          EXISTS (
              SELECT 1 FROM chat_room_members AS my_rooms
              WHERE my_rooms.room_id = chat_room_members.room_id
              AND my_rooms.user_id = auth.uid()
              AND my_rooms.status = 'active'
          )
      );

      -- Políticas para chat_messages
      DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON chat_messages;
      CREATE POLICY "Users can view messages in their chat rooms"
      ON chat_messages
      FOR SELECT
      USING (
          EXISTS (
              SELECT 1 FROM chat_room_members
              WHERE room_id = chat_messages.room_id
              AND user_id = auth.uid()
              AND status = 'active'
          )
      );
    `

    // Escribir SQL a archivo temporal
    writeFileSync(sqlFile, sql)

    // Ejecutar SQL usando psql
    const { stdout, stderr } = await execAsync(`psql "postgres://postgres:${process.env.POSTGRES_PASSWORD}@${process.env.SUPABASE_DB_HOST}:5432/postgres" -f ${sqlFile}`)

    console.log('Salida:', stdout)
    if (stderr) console.error('Errores:', stderr)

    // Limpiar archivo temporal
    unlinkSync(sqlFile)

    console.log('Configuración completada con éxito')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

setupChatFunctions() 