import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

const errorHandler = (error: unknown) => {
  console.error('Supabase Error:', error)
  return error
}

export const supabaseService = {
  auth: {
    async login(email: string, password: string) {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        return { data: { user: data.user }, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    },

    async logout() {
      const supabase = createClientComponentClient<Database>()
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
      } catch (error) {
        errorHandler(error)
        return { error }
      }
    },

    async getSession() {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return { data: { session }, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    },

    async getUser() {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return { data: { user }, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    }
  },

  user: {
    async get(userId: string) {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    },

    async update(userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId)
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    }
  },

  organization: {
    async get(organizationId: string) {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    },

    async update(organizationId: string, updates: Partial<Database['public']['Tables']['organizations']['Update']>) {
      const supabase = createClientComponentClient<Database>()
      try {
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', organizationId)
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        errorHandler(error)
        return { data: null, error }
      }
    }
  }
} 