'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import Calendar from './components/Calendar'
import { TaskModal } from './components/TaskModal'
import { Database } from '@/lib/types/database'

type Task = Database['public']['Tables']['tasks']['Row']

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
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

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!userProfile) throw new Error('Perfil no encontrado')

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('due_date', { ascending: true })

      if (error) throw error

      setTasks(tasks || [])
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
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!userProfile) throw new Error('Perfil no encontrado')

      if (selectedTask) {
        // Actualizar tarea existente
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            ...taskData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTask.id)

        if (updateError) throw updateError
        toast.success('Tarea actualizada correctamente')
      } else {
        // Crear nueva tarea
        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            organization_id: userProfile.organization_id,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) throw insertError
        toast.success('Tarea creada correctamente')
      }

      await loadTasks()
      setShowTaskModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Error al guardar la tarea')
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
        task={selectedTask}
      />
    </div>
  )
}
