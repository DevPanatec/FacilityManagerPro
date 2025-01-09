import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type User = Database['public']['Tables']['users']['Row']

export class AreaService extends BaseService {
  /**
   * Obtiene las tareas de un área específica
   */
  async getAreaTasks(areaId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('area_id', areaId)
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene los usuarios asignados a un área
   */
  async getAreaUsers(areaId: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('area_id', areaId)
        .order('email')

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Asigna una tarea a un área
   */
  async assignTaskToArea(taskId: string, areaId: string): Promise<Task> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({
          area_id: areaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const areaService = new AreaService() 