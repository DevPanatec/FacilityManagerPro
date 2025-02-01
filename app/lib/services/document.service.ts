import { BaseService } from './base.service'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type User = Database['public']['Tables']['users']['Row']

export class DocumentService extends BaseService {
  /**
   * Obtiene los documentos adjuntos a una tarea
   */
  async getTaskDocuments(taskId: string): Promise<Task[]> {
    try {
      // Primero obtenemos la tarea para obtener su organization_id
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .select('organization_id')
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', task.organization_id)
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtiene los documentos creados por un usuario
   */
  async getUserDocuments(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Adjunta un documento a una tarea
   */
  async attachDocumentToTask(taskId: string, documentData: { title: string; description?: string }): Promise<Task> {
    try {
      // Primero obtenemos la tarea padre para obtener su organization_id
      const { data: parentTask, error: parentError } = await this.supabase
        .from('tasks')
        .select('organization_id')
        .eq('id', taskId)
        .single()

      if (parentError) throw parentError

      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          ...documentData,
          organization_id: parentTask.organization_id,
          area_id: null,
          status: 'pending',
          priority: 'low',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      return this.handleResponse(data, error)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Exportar instancia única
export const documentService = new DocumentService() 