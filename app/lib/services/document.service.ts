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
      const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', taskId)
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
      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          ...documentData,
          parent_task_id: taskId,
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