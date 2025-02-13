import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config.base'

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
        set(name: string, value: string) {
          cookieStore.set(name, value, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60
          })
        },
        remove(name: string) {
          cookieStore.set(name, '', {
            path: '/',
            maxAge: 0
          })
        }
      }
    }
  )
} 