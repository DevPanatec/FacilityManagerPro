import { supabaseService } from './supabaseService'
import { Database } from '@/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']
type CreateNotification = Pick<Notification, 'message' | 'title' | 'type' | 'user_id' | 'organization_id'>

export const notificationService = {
  getNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabaseService.db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al obtener notificaciones:', error)
      throw error
    }
  },

  createNotification: async (notification: Omit<CreateNotification, 'organization_id'>) => {
    try {
      // Obtener el usuario actual
      const { data: userData } = await supabaseService.db.auth.getUser()
      if (!userData.user) throw new Error('Usuario no autenticado')

      // Obtener el organization_id del usuario
      const { data: userDetails, error: userError } = await supabaseService.db
        .from('users')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single()

      if (userError || !userDetails?.organization_id) {
        throw new Error('No se pudo obtener la organización del usuario')
      }

      const { data, error } = await supabaseService.db
        .from('notifications')
        .insert([{
          ...notification,
          organization_id: userDetails.organization_id,
          read: false
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al crear notificación:', error)
      throw error
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { data, error } = await supabaseService.db
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      throw error
    }
  }
} 