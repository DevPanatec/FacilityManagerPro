import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type User = Database['public']['Tables']['users']['Row']

export class ActivityLogService extends BaseService {
  /**
   * Registra una nueva actividad
   */
  async logActivity(
    userId: string,
    action: string,
    entityType: 'task' | 'user',
    entityId: string,
    details: any,
    organizationId?: string
  ): Promise<void> {
    try {
      // En lugar de guardar en una tabla separada, actualizamos el campo updated_at
      // y registramos la actividad en los logs del sistema
      console.log(`[${new Date().toISOString()}] ${action} - Usuario: ${userId}, Entidad: ${entityType}:${entityId}`, details)

      if (entityType === 'task') {
        await this.supabase
          .from('tasks')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', entityId)
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene el historial de actividades de una tarea
   */
  async getTaskHistory(taskId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .order('updated_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene el historial de actividades de un usuario
   */
  async getUserHistory(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('created_by', userId)
        .order('updated_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const activityLogService = new ActivityLogService() 