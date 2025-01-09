import { supabaseService } from './supabaseService'

export const authService = {
  login: async (email: string, password: string) => {
    try {
      return await supabaseService.auth.login(email, password)
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },

  register: async (email: string, password: string, userData: any) => {
    try {
      const { data: auth, error: signUpError } = await supabaseService.db.auth.signUp({
        email,
        password
      })
      if (signUpError) throw signUpError

      if (auth.user) {
        const { error: profileError } = await supabaseService.db
          .from('users')
          .insert([{
            ...userData,
            id: auth.user.id,
            email: auth.user.email
          }])
        if (profileError) throw profileError
      }

      return auth
    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  },

  logout: async () => {
    try {
      await supabaseService.auth.logout()
    } catch (error) {
      console.error('Error en logout:', error)
      throw error
    }
  },

  getCurrentUser: async () => {
    try {
      return await supabaseService.auth.getUser()
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
      throw error
    }
  }
} 