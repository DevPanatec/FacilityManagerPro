import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const store = await cookieStore
        return store.get(name)?.value
      },
      async set(name: string, value: string, options: CookieOptions) {
        const store = await cookieStore
        store.set({ name, value, ...options })
      },
      async remove(name: string, options: CookieOptions) {
        const store = await cookieStore
        store.delete({ name, ...options })
      },
    },
  })
} 