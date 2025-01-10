import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { errorHandler } from '@/utils/errorHandler'

const SUPABASE_URL = 'https://wldiefpqmfjxernvuywv.supabase.co'
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
        errorHandler.logError('auth.login', error)
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
        errorHandler.logError('auth.logout', error)
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
        errorHandler.logError('auth.getUser', error)
        return { data: null, error }
      }
    }
  },

  db: getSupabaseClient()
} 