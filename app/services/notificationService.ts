import { supabaseService } from './supabaseService'
import { Database } from '@/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']
type CreateNotification = Pick<Notification, 'message' | 'title' | 'type' | 'user_id' | 'organization_id'>

export const notificationService = {
  getNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabaseService
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al obtener notificaciones:', error)
      throw error
    }
  },

  createNotification: async (notification: any) => {
    try {
      const { data, error } = await supabaseService
        .from('notifications')
        .insert([notification])
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
      const { error } = await supabaseService
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      throw error
    }
  }
} 