'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

// Singleton para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      cookieOptions: {
        name: 'sb-session',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      }
    })
  }
  return supabaseInstance
}

// Exportar una instancia única para uso en toda la aplicación
export const supabase = getSupabaseClient() 