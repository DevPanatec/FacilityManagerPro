'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Calendar, { Task, TaskStatus } from './components/Calendar'
import TaskModal from './components/TaskModal'
import { Database } from '@/lib/types/database'

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userData } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (!userData) throw new Error('Usuario no encontrado')

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey(
            id,
            first_name,
            last_name
          ),
          organization:organizations!tasks_organization_id_fkey(
            id,
            name
          ),
          area:areas!tasks_area_id_fkey(
            id,
            name
          )
        `)
        .order('due_date', { ascending: true })

      // Si no es superadmin, filtrar por organization_id
      if (userData.role !== 'superadmin') {
        if (!userData.organization_id) {
          throw new Error('Usuario no tiene organización asignada')
        }
        query = query.eq('organization_id', userData.organization_id)
      }

      const { data: tasks, error } = await query
      
      if (error) throw error
      
      // Transformar los datos para que coincidan con el tipo Task
      const transformedTasks = tasks?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        priority: task.priority as 'low' | 'medium' | 'high',
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        organization_id: task.organization_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        area_id: task.area_id,
        due_date: task.due_date,
        assignee: task.assignee ? {
          id: task.assignee.id,
          first_name: task.assignee.first_name,
          last_name: task.assignee.last_name
        } : undefined,
        organization: task.organization ? {
          id: task.organization.id,
          name: task.organization.name
        } : undefined,
        area: task.area ? {
          id: task.area.id,
          name: task.area.name
        } : undefined
      })) || []
      
      setTasks(transformedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setError('Error al cargar las tareas')
      toast.error('Error al cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userProfile) throw new Error('Usuario no encontrado')

      // Asegurar que todos los campos requeridos estén presentes
      const requiredFields = {
        title: taskData.title,
        area_id: taskData.area_id,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date
      }

      // Verificar campos requeridos
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          throw new Error(`El campo ${field} es requerido`)
        }
      }

      if (selectedTask) {
        // Actualizar tarea existente
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            ...taskData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTask.id)

        if (updateError) {
          console.error('Error de actualización:', updateError)
          throw new Error('Error al actualizar la tarea: ' + updateError.message)
        }
        toast.success('Tarea actualizada correctamente')
      } else {
        // Crear nueva tarea
        const newTask = {
          ...taskData,
          organization_id: userProfile.organization_id,
          created_by: user.id,
          status: taskData.status || 'pending' as TaskStatus,
          priority: taskData.priority || 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(newTask)

        if (insertError) {
          console.error('Error de inserción:', insertError)
          throw new Error('Error al crear la tarea: ' + insertError.message)
        }
        toast.success('Tarea creada correctamente')
      }

      await loadTasks()
      setShowTaskModal(false)
      setSelectedTask(undefined)
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar la tarea')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (deleteError) throw deleteError

      await loadTasks()
      toast.success('Tarea eliminada correctamente')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error al eliminar la tarea')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendario</h1>

      <Calendar
        tasks={tasks}
        onTaskClick={task => {
          setSelectedTask(task)
          setShowTaskModal(true)
        }}
        onAddTask={(date) => {
          setSelectedTask(undefined)
          setShowTaskModal(true)
        }}
        onDeleteTask={handleDeleteTask}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedTask(undefined)
        }}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </div>
  )
}
