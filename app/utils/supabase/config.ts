import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jecxswfoepdstrghyouv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY3hzd2ZvZXBkc3RyZ2h5b3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyMTI5NTEsImV4cCI6MjA0Nzc4ODk1MX0.LbxiCt3dBJC6rEr3n_2WsmY87eUQy7_M-qFtSElB7h8'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY3hzd2ZvZXBkc3RyZ2h5b3V2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjIxMjk1MSwiZXhwIjoyMDQ3Nzg4OTUxfQ.zaXR1HkRYt2_SuKDx-Tj8u0IEOrDeSUNRLqpcyj6A8c'

// Cliente para operaciones públicas (usando anon key)
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Cliente para operaciones administrativas (usando service role key)
export const createAdminClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey)
} 