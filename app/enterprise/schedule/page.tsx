'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Calendar from '@/app/shared/schedule/components/Calendar'

interface Task {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: 'pending' | 'completed' | 'cancelled'
  area: string
  turno: 'A' | 'B' | 'C'
  asignado_a: string[]
}

export default function EnterpriseSchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tareas')
          .select('*')
          .order('fecha')

        if (error) throw error

        setTasks(data || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching tasks:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchTasks()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('tareas_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tareas' 
      }, payload => {
        console.log('Change received!', payload)
        fetchTasks()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleTaskClick = (task: any) => {
    console.log('Task clicked:', task)
  }

  const handleAddTask = (date: string) => {
    console.log('Add task for date:', date)
  }

  const handleDeleteTask = (id: string) => {
    console.log('Delete task:', id)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6">Cargando...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-6">Error: {error}</div>
  }

  const transformedTasks = tasks.map(task => ({
    id: task.id,
    title: task.titulo,
    description: task.descripcion,
    area_id: task.area,
    assigned_to: task.asignado_a?.[0] || null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: task.estado as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    due_date: task.fecha || null,
    created_by: task.asignado_a?.[0] || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendario de Tareas</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <Calendar 
            tasks={transformedTasks}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  )
} 