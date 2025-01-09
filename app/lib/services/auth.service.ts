import { BaseService } from './base.service'
import { AuthError, User as AuthUser, Session } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type DbUser = Database['public']['Tables']['users']['Row']

// Definimos una interfaz base para nuestro usuario
export interface User {
  id: string
  email: string
  created_at: string
  role: 'admin' | 'enterprise' | 'usuario'
  avatar_url: string | null
  first_name: string | null
  last_name: string | null
  organization_id: string | null
  status: string | null
  updated_at: string | null
  // Campos de AuthUser que necesitamos
  aud: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  identities?: AuthUser['identities']
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  first_name: string
  last_name: string
  role?: 'admin' | 'enterprise' | 'usuario'
}

export interface AuthResponse {
  user: User | null
  session: Session | null
}

class AuthService extends BaseService {
  async login({ email, password }: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Si el login es exitoso, obtener datos adicionales del usuario
      if (data.user && data.user.email) {
        const { data: userData, error: userError } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        // Asegurarnos de que created_at no sea null
        const created_at = userData.created_at || data.user.created_at || new Date().toISOString()

        // Combinar datos de auth y perfil
        const user: User = {
          ...userData,
          id: data.user.id,
          email: data.user.email,
          created_at,
          aud: data.user.aud || '',
          app_metadata: data.user.app_metadata || {},
          user_metadata: data.user.user_metadata || {},
          identities: data.user.identities,
          role: userData.role as 'admin' | 'enterprise' | 'usuario'
        }

        return {
          user,
          session: data.session
        }
      }

      return {
        user: null,
        session: data.session
      }
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (authError) throw authError

      if (authData.user && authData.user.email) {
        // Crear perfil de usuario
        const { data: profileData, error: profileError } = await this.supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role || 'usuario',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (profileError) throw profileError

        const user: User = {
          ...profileData,
          id: authData.user.id,
          email: authData.user.email,
          created_at: profileData.created_at || new Date().toISOString(),
          aud: authData.user.aud || '',
          app_metadata: authData.user.app_metadata || {},
          user_metadata: authData.user.user_metadata || {},
          identities: authData.user.identities,
          role: profileData.role as 'admin' | 'enterprise' | 'usuario'
        }

        return {
          user,
          session: authData.session
        }
      }

      return {
        user: null,
        session: null
      }
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error } = await this.supabase.auth.getUser()
      if (error) throw error

      if (authUser && authUser.email) {
        const { data: userData, error: userError } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) throw userError

        const user: User = {
          ...userData,
          id: authUser.id,
          email: authUser.email,
          created_at: userData.created_at || authUser.created_at || new Date().toISOString(),
          aud: authUser.aud || '',
          app_metadata: authUser.app_metadata || {},
          user_metadata: authUser.user_metadata || {},
          identities: authUser.identities,
          role: userData.role as 'admin' | 'enterprise' | 'usuario'
        }

        return user
      }

      return null
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      throw this.handleAuthError(error)
    }
  }

  private handleAuthError(error: unknown): never {
    console.error('Error de autenticación:', error)

    if (error instanceof AuthError) {
      switch (error.status) {
        case 400:
          throw new Error('Datos de autenticación inválidos')
        case 401:
          throw new Error('No autorizado')
        case 404:
          throw new Error('Usuario no encontrado')
        case 422:
          throw new Error('El correo electrónico ya está registrado')
        default:
          throw new Error(`Error de autenticación: ${error.message}`)
      }
    }

    throw error instanceof Error ? error : new Error('Error desconocido de autenticación')
  }
}

// Exportar instancia única
export const authService = new AuthService() 