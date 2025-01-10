import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const SUPABASE_URL = 'https://wldiefpqmfjxernvuywv.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente para componentes del lado del cliente
export const createClientSupabase = () => {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

// Cliente para componentes del lado del servidor
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            cookieStore.set({
              name,
              value,
              ...options
            })
          } catch (error) {
            // Ignorar errores al establecer cookies durante SSG
          }
        },
        remove(name: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options
            })
          } catch (error) {
            // Ignorar errores al eliminar cookies durante SSG
          }
        },
      },
    }
  )
}

// Instancia del cliente para uso general en el lado del cliente
export const supabase = createClientSupabase() 