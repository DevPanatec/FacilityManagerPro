import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { errorHandler } from '@/utils/errorHandler'

const supabase = createClientComponentClient<Database>()

export const supabaseService = {
  auth: {
    async login(email: string, password: string) {
      try {
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
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      } catch (error) {
        errorHandler.logError('auth.logout', error)
        throw error
      }
    },

    async getUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return { data: { user: data.user }, error: null }
      } catch (error) {
        errorHandler.logError('auth.getUser', error)
        return { data: null, error }
      }
    }
  },

  db: supabase
} 