import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Cliente con rol de servicio para operaciones administrativas
export const createAdminClient = () => {
  // Usar las variables de entorno públicas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Variables de entorno de Supabase no configuradas')
    return createClient<Database>(
      'https://wldiefpqmfjxernvuywv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZGllZnBxbWZqeGVybnZ1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDY0MjUsImV4cCI6MjA1MTg4MjQyNX0.Hs3oj-rF_lKvpGBFVL_E2Zd1CxeeDfGlqmO7YI1fGtw'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente singleton para uso en servicios
export const supabaseAdmin = createAdminClient() 