import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/types'
import { errorHandler } from '../utils/errorHandler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creamos una instancia del cliente de Supabase con las opciones de realtime
export const supabaseService = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Mantenemos los métodos de autenticación separados para mayor claridad
export const authService = {
  async login(email: string, password: string) {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService.auth.signInWithPassword({
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
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { error } = await supabaseService.auth.signOut()
      if (error) throw error
    } catch (error) {
      errorHandler.logError('auth.logout', error)
      throw error
    }
  },

  async getUser() {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService.auth.getUser()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('auth.getUser', error)
      return { data: null, error }
    }
  },

  async getSession() {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService.auth.getSession()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('auth.getSession', error)
      return { data: null, error }
    }
  }
}

export const usersService = {
  async getProfile(userId: string) {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('users.getProfile', error)
      return { data: null, error }
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('users.updateProfile', error)
      return { data: null, error }
    }
  }
}

export const organizationsService = {
  async getOrganization(orgId: string) {
    try {
      if (!supabaseService) throw new Error('Supabase client not initialized')
      
      const { data, error } = await supabaseService
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('organizations.getOrganization', error)
      return { data: null, error }
    }
  }
} 