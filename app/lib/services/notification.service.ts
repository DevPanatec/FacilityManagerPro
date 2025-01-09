import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export class NotificationService extends BaseService {
  /**
   * Crea una nueva notificación
   */
  async createNotification(notificationData: Omit<NotificationInsert, 'created_at' | 'read'>): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          ...notificationData,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene una notificación por ID
   */
  async getNotificationById(id: string): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const notificationService = new NotificationService() 