import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'
import { CookieOptions } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY, baseAuthConfig, baseGlobalConfig } from '@/lib/supabase/config.base'

// Cliente para componentes del lado del servidor
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      ...baseAuthConfig,
      ...baseGlobalConfig,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          cookieStore.set({
            name,
            value,
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 días
          })
        },
        remove(name: string, options: CookieOptions = {}) {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )
} 