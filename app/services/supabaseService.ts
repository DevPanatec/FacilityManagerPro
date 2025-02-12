import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { errorHandler } from '@/app/utils/errorHandler'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const getSupabaseClient = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...(token ? { 
        storage: {
          getItem: (key: string) => {
            if (key === 'sb-access-token') return token
            return null
          },
          setItem: () => {},
          removeItem: () => {}
        }
      } : {})
    }
  })
}

export const supabaseService = {
  auth: {
    async login(email: string, password: string) {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        return { data: { user: data.user }, error: null }
      } catch (error) {
        console.error('[auth.login] Error:', error)
        return { data: null, error }
      }
    },

    async logout() {
      try {
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('adminPrincipal')
      } catch (error) {
        console.error('[auth.logout] Error:', error)
        throw error
      }
    },

    async getUser() {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return { data: { user: data.user }, error: null }
      } catch (error) {
        console.error('[auth.getUser] Error:', error)
        return { data: null, error }
      }
    }
  },

  db: getSupabaseClient()
} 