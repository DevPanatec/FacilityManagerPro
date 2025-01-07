import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              httpOnly: true,
              priority: 'high'
            })
          } catch (error) {
            console.error('Cookie set error:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({
              name,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          } catch (error) {
            console.error('Cookie remove error:', error)
          }
        }
      },
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
        autoRefreshToken: true,
        persistSession: true,
        cookieOptions: {
          name: 'sb-session',
          lifetime: 60 * 60 * 24 * 7, // 1 week
          domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production'
        }
      },
      global: {
        headers: {
          'x-application-name': 'facility-manager-pro'
        }
      }
    }
  )
} 
