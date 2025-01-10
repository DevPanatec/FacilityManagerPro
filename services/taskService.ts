import { supabaseService, authService } from './supabaseService'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export const taskService = {
  // Obtener tareas según el rol del usuario
  async getTasks(): Promise<Task[]> {
    try {
      const { data: authData, error: authError } = await authService.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { data: tasks, error: tasksError } = await supabaseService
        .from('tasks')
        .select('*')
      if (tasksError) throw tasksError

      // Filtrar tareas según el rol del usuario
      const { data: profile, error: profileError } = await supabaseService
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()
      if (profileError) throw profileError

      if (profile?.role === 'enterprise') {
        return tasks.filter(task => task.assigned_to === authData.user.id)
      }
      return tasks
    } catch (error) {
      console.error('Error al obtener tareas:', error)
      throw error
    }
  },

  // Crear una nueva tarea
  async createTask(taskData: Partial<TaskInsert>): Promise<Task> {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const newTask: TaskInsert = {
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        organization_id: taskData.organization_id || '',
        created_by: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newTaskData, error: createError } = await supabaseService
        .from('tasks')
        .insert([newTask])
        .select()
        .single()
      if (createError) throw createError

      // Verificar si se creó correctamente
      const { data: createdTask, error: verifyError } = await supabaseService
        .from('tasks')
        .select('*')
        .eq('id', newTaskData.id)
        .single()
      if (verifyError) throw verifyError

      return createdTask
    } catch (error) {
      console.error('Error al crear la tarea:', error)
      throw error
    }
  },

  // Actualizar una tarea existente
  async updateTask(id: string, updates: Partial<TaskUpdate>): Promise<Task> {
    try {
      const { data: updatedTask, error: updateError } = await supabaseService
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (updateError) throw updateError

      return updatedTask
    } catch (error) {
      console.error('Error al actualizar la tarea:', error)
      throw error
    }
  },

  // Eliminar una tarea
  async deleteTask(id: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabaseService
        .from('tasks')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError

      return true
    } catch (error) {
      console.error('Error al eliminar la tarea:', error)
      throw error
    }
  },

  // Asignar una tarea a un usuario
  async assignTask(taskId: string, userId: string): Promise<Task> {
    try {
      const { data: updatedTask, error: updateError } = await supabaseService
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId)
        .select()
        .single()
      if (updateError) throw updateError

      return updatedTask
    } catch (error) {
      console.error('Error al asignar la tarea:', error)
      throw error
    }
  }
} 