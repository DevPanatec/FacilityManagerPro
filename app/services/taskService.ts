import { supabaseService } from './supabaseService'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

export const taskService = {
  // Obtener tareas según el rol del usuario
  getTasks: async (): Promise<Task[]> => {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { data: tasks, error: tasksError } = await supabaseService
        .from('tasks')
        .select('*')
      if (tasksError) throw tasksError

      return tasks || []
    } catch (error) {
      console.error('Error al obtener tareas:', error)
      throw error
    }
  },

  // Crear una nueva tarea
  createTask: async (task: Partial<Task>): Promise<Task> => {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabaseService
        .from('tasks')
        .insert([task])
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No se pudo crear la tarea')
      
      return data
    } catch (error) {
      console.error('Error al crear tarea:', error)
      throw error
    }
  },

  // Actualizar una tarea existente
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabaseService
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No se pudo actualizar la tarea')
      
      return data
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
      throw error
    }
  },

  // Eliminar una tarea
  deleteTask: async (taskId: string): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { error } = await supabaseService
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error al eliminar tarea:', error)
      throw error
    }
  },

  // Asignar una tarea a un usuario
  assignTask: async (taskId: string, userId: string): Promise<Task> => {
    try {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabaseService
        .from('tasks')
        .update({
          assigned_to: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No se pudo asignar la tarea')
      
      return data
    } catch (error) {
      console.error('Error al asignar tarea:', error)
      throw error
    }
  }
} 