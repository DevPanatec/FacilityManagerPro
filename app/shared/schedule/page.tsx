'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Calendar from './components/Calendar'
import { TaskModal } from './components/TaskModal'
import { Database } from '@/lib/types/database'
import { taskService } from '@/app/services/taskService'

type TaskInput = {
  id?: string
  organization_id: string
  title: string
  description?: string | null
  area_id?: string | null
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  assigned_to?: string | null
  due_date?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  start_time?: string | null
  end_time?: string | null
  type?: string | null
  frequency?: 'diario' | 'semanal' | 'quincenal' | 'mensual' | null
  sala_id?: string | null
  parent_task_id?: string | null
  order?: number | null
  estimated_hours?: number | null
}

type Task = {
  id: string
  organization_id: string
  title: string
  description: string | null
  area_id: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  start_time: string | null
  end_time: string | null
  type: string | null
  frequency: 'diario' | 'semanal' | 'quincenal' | 'mensual' | null
  sala_id: string | null
  parent_task_id: string | null
  order: number | null
  estimated_hours: number | null
  assignee?: {
    first_name: string | null
    last_name: string | null
  }
  organization?: {
    id: string
    name: string
  }
}

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadTasks()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        () => {
          loadTasks()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el servicio compartido para cargar todas las tareas
      const allTasks = await taskService.loadAllTasks();
      console.log('Tareas cargadas con servicio compartido para el Calendario:', allTasks);
      
      // Formatear las tareas para incluir assignee en el formato esperado por el calendario
      const formattedTasks = allTasks.map(task => ({
        ...task,
        assignee: task.users ? {
          first_name: task.users.first_name,
          last_name: task.users.last_name
        } : undefined
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error detallado al cargar tareas:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      })
      setError('Error al cargar las tareas')
      toast.error('Error al cargar las tareas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async (taskData: TaskInput) => {
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
      if (!taskData.title) {
        throw new Error('El título es requerido')
      }

      // Asegurarse de que due_date esté presente como un campo ISO string (YYYY-MM-DD)
      let dueDate = taskData.due_date;
      
      // Si no se proporcionó una fecha, usar la fecha seleccionada o la actual
      if (!dueDate && selectedDate) {
        dueDate = new Date(selectedDate).toISOString().split('T')[0];
      } else if (!dueDate) {
        dueDate = new Date().toISOString().split('T')[0];
      }

      // Asegurar que la fecha sea un string en formato ISO
      if (dueDate instanceof Date) {
        dueDate = dueDate.toISOString().split('T')[0];
      }
      
      // Actualizar taskData con la fecha ajustada
      const updatedTaskData = {
        ...taskData,
        due_date: dueDate,
        type: taskData.type || 'calendar', // Establecer tipo por defecto para que aparezca en el calendario
      };

      if (selectedTask) {
        // Actualizar tarea existente
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            ...updatedTaskData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTask.id)

        if (updateError) throw updateError
        toast.success('Tarea actualizada correctamente')
      } else {
        // Crear nueva tarea
        const newTask = {
          ...updatedTaskData,
          organization_id: userProfile.organization_id,
          created_by: user.id,
          status: updatedTaskData.status || 'pending',
          priority: updatedTaskData.priority || 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(newTask)

        if (insertError) throw insertError
        toast.success('Tarea creada correctamente')
      }

      await loadTasks()
      setShowTaskModal(false)
      setSelectedTask(null)
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
          setSelectedTask(null)
          setSelectedDate(date)
          setShowTaskModal(true)
        }}
        onDeleteTask={handleDeleteTask}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedTask(null)
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        organizationId={tasks[0]?.organization_id || ''}
      />
    </div>
  )
}
