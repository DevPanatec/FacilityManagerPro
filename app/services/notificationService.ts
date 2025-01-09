import { supabaseService } from './supabaseService'
import { Database } from '@/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']
type CreateNotification = Pick<Notification, 'message' | 'title' | 'type' | 'organization_id'> & Partial<Omit<Notification, 'message' | 'title' | 'type' | 'organization_id'>>

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

  createNotification: async (notification: CreateNotification) => {
    try {
      const { data, error } = await supabaseService.db
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