import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { supabaseService } from './supabaseService'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export const taskService = {
  async getTasks() {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Obtener tareas
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          created_by:users!tasks_created_by_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          area:areas (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Filtrar tareas según el rol
      const filteredTasks = userData?.role === 'enterprise'
        ? tasks.filter(task => task.assigned_to === userId)
        : tasks

      return { data: filteredTasks, error: null }
    } catch (error) {
      console.error('Error getting tasks:', error)
      return { data: null, error }
    }
  },

  async getTask(taskId: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Obtener tarea
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:users!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          created_by:users!tasks_created_by_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          area:areas (
            id,
            name
          )
        `)
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      // Verificar permisos
      if (userData?.role === 'enterprise' && task.assigned_to !== userId) {
        throw new Error('No tienes permiso para ver esta tarea')
      }

      return { data: task, error: null }
    } catch (error) {
      console.error('Error getting task:', error)
      return { data: null, error }
    }
  },

  async createTask(taskData: TaskInsert) {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Verificar permisos
      if (userData?.role === 'enterprise') {
        throw new Error('No tienes permiso para crear tareas')
      }

      // Crear tarea
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_by: userId,
          status: taskData.status || 'pending'
        }])
        .select()
        .single()

      if (taskError) throw taskError
      return { data: task, error: null }
    } catch (error) {
      console.error('Error creating task:', error)
      return { data: null, error }
    }
  },

  async updateTask(taskId: string, updates: TaskUpdate) {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Verificar permisos
      if (userData?.role === 'enterprise') {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select()
          .eq('id', taskId)
          .single()

        if (taskError) throw taskError
        if (!task || task.assigned_to !== userId) {
          throw new Error('No tienes permiso para modificar esta tarea')
        }
      }

      // Actualizar tarea
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (taskError) throw taskError
      return { data: task, error: null }
    } catch (error) {
      console.error('Error updating task:', error)
      return { data: null, error }
    }
  },

  async deleteTask(taskId: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Verificar permisos
      if (userData?.role === 'enterprise') {
        throw new Error('No tienes permiso para eliminar tareas')
      }

      // Eliminar tarea
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (taskError) throw taskError
      return { error: null }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { error }
    }
  },

  // Asignar una tarea a un usuario
  async assignTask(taskId: string, assignedUserId: string) {
    const supabase = createClientComponentClient<Database>()
    try {
      const authData = await supabaseService.auth.getUser()
      if (!authData?.data?.user) throw new Error('Usuario no autenticado')
      const userId = authData.data.user.id

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Verificar permisos
      if (userData?.role === 'enterprise') {
        throw new Error('No tienes permiso para asignar tareas')
      }

      // Verificar que el usuario asignado existe
      const { data: assignedUser, error: assignedUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', assignedUserId)
        .single()

      if (assignedUserError) throw assignedUserError
      if (!assignedUser) throw new Error('Usuario asignado no encontrado')

      // Asignar tarea
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .update({ assigned_to: assignedUserId })
        .eq('id', taskId)
        .select()
        .single()

      if (taskError) throw taskError
      return { data: task, error: null }
    } catch (error) {
      console.error('Error assigning task:', error)
      return { data: null, error }
    }
  }
} 