import { Database } from '@/lib/types/database'

// Configuración base compartida
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Configuración base de autenticación
export const baseAuthConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  }
}

// Configuración global compartida
export const baseGlobalConfig = {
  global: {
    headers: {
      'X-Client-Info': 'facility-manager-pro',
    },
  }
} 