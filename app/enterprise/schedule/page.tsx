'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Calendar from '@/components/Calendar'

interface Task {
  id: string
  titulo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  prioridad: 'baja' | 'media' | 'alta'
  asignado_a: string
  area: string
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
          .order('fecha_inicio')

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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-6">Cargando...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-6">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendario de Tareas</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <Calendar 
            events={tasks.map(task => ({
              id: task.id,
              title: task.titulo,
              start: new Date(task.fecha_inicio),
              end: new Date(task.fecha_fin),
              description: task.descripcion,
              status: task.estado,
              priority: task.prioridad,
              assignedTo: task.asignado_a,
              area: task.area
            }))}
          />
        </div>
      </div>
    </div>
  )
} 