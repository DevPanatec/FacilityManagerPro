import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const supabaseClient = createClientComponentClient<Database>()

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async logout() {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser()
    if (error) throw error
    return user
  },

  async getUserRole() {
    const user = await this.getCurrentUser()
    if (!user) return null
    
    const { data, error } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (error) throw error
    return data?.role
  },

  async isAdmin() {
    const role = await this.getUserRole()
    return ['admin', 'superadmin'].includes(role || '')
  }
} 