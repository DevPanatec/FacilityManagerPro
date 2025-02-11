import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const checkDatabase = async () => {
  try {
    console.log('Verificando tablas y funciones...\n')

    // Consulta para obtener todas las tablas y sus columnas
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          WITH table_columns AS (
            SELECT 
              t.table_name,
              jsonb_agg(
                jsonb_build_object(
                  'column_name', c.column_name,
                  'data_type', c.data_type,
                  'is_nullable', c.is_nullable
                ) ORDER BY c.ordinal_position
              ) as columns
            FROM information_schema.tables t
            JOIN information_schema.columns c 
              ON c.table_name = t.table_name 
              AND c.table_schema = t.table_schema
            WHERE t.table_schema = 'public'
              AND t.table_type = 'BASE TABLE'
            GROUP BY t.table_name
          )
          SELECT 
            table_name,
            columns,
            pg_total_relation_size(quote_ident(table_name)) as total_size,
            pg_relation_size(quote_ident(table_name)) as table_size,
            pg_total_relation_size(quote_ident(table_name)) - pg_relation_size(quote_ident(table_name)) as index_size,
            (SELECT count(*) FROM information_schema.table_constraints tc 
             WHERE tc.table_name = tc.table_name 
             AND tc.constraint_type = 'FOREIGN KEY') as foreign_keys_count
          FROM table_columns
          ORDER BY table_name;
        `
      })

    if (tablesError) {
      console.error('Error al obtener tablas:', tablesError)
    } else {
      console.log('Estructura de tablas:', JSON.stringify(tables, null, 2))
      console.log('\n-------------------\n')
    }

    // Consulta para obtener todas las funciones
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments,
            t.typname as return_type,
            p.prosecdef as security_definer,
            p.provolatile as volatility,
            obj_description(p.oid, 'pg_proc') as description
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          JOIN pg_type t ON p.prorettype = t.oid
          WHERE n.nspname = 'public'
          ORDER BY p.proname;
        `
      })

    if (functionsError) {
      console.error('Error al obtener funciones:', functionsError)
    } else {
      console.log('Funciones definidas:', JSON.stringify(functions, null, 2))
      console.log('\n-------------------\n')
    }

    // Consulta para obtener todas las políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname;
        `
      })

    if (policiesError) {
      console.error('Error al obtener políticas:', policiesError)
    } else {
      console.log('Políticas RLS:', JSON.stringify(policies, null, 2))
      console.log('\n-------------------\n')
    }

    // Consulta para obtener todas las extensiones
    const { data: extensions, error: extensionsError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            e.extname,
            e.extversion,
            n.nspname as schema,
            c.description
          FROM pg_extension e
          JOIN pg_namespace n ON n.oid = e.extnamespace
          LEFT JOIN pg_description c ON c.objoid = e.oid
          ORDER BY e.extname;
        `
      })

    if (extensionsError) {
      console.error('Error al obtener extensiones:', extensionsError)
    } else {
      console.log('Extensiones instaladas:', JSON.stringify(extensions, null, 2))
    }

  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

checkDatabase() 