import { supabase } from '@/lib/supabase/config'
import { errorHandler } from '@/utils/errorHandler'

// Exportamos el cliente de Supabase directamente
export const supabaseService = supabase

// Mantenemos los métodos de autenticación separados para mayor claridad
export const authService = {
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
      return { data, error: null }
    } catch (error) {
      errorHandler.logError('auth.getUser', error)
      return { data: null, error }
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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