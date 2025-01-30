'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Calendar from '@/app/shared/schedule/components/Calendar'
import TaskModal from './components/TaskModal'

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
  organization_id: string
  prioridad: 'baja' | 'media' | 'alta'
}

export default function EnterpriseSchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    // Obtener el perfil del usuario y sus tareas
    const fetchUserAndTasks = async () => {
      try {
        setLoading(true)
        
        // 1. Obtener el perfil del usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No se encontró el usuario')

        // 2. Obtener el perfil completo con la organización
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, organizations(*)')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        console.log('User profile loaded:', profile)
        setUserProfile(profile)

        // 3. Obtener las tareas filtradas por la organización
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            area:area_id(id, name),
            assignee:assigned_to(id, first_name, last_name)
          `)
          .eq('organization_id', profile.organization_id)
          .order('due_date')

        if (error) throw error

        setTasks(data || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchUserAndTasks()

    // Suscribirse a cambios en tiempo real (solo para la organización actual)
    const subscription = supabase
      .channel('tareas_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tareas',
        filter: userProfile ? `organization_id=eq.${userProfile.organization_id}` : undefined
      }, payload => {
        console.log('Change received!', payload)
        fetchUserAndTasks()
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
    if (!userProfile?.organization_id) {
      console.error('No organization ID available')
      return
    }
    // La fecha ya viene en formato datetime-local del calendario
    setSelectedDate(date)
    setShowTaskModal(true)
  }

  const handleTaskSubmit = async (taskData: any) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.titulo,
          description: taskData.descripcion,
          area_id: taskData.area_id,
          status: taskData.status,
          priority: taskData.prioridad,
          assigned_to: taskData.asignado_a?.[0] || null,
          due_date: taskData.fecha,
          organization_id: userProfile.organization_id
        }])
        .select()

      if (error) throw error

      // Actualizar la lista de tareas localmente
      setTasks(prevTasks => [...prevTasks, data[0]])
      setShowTaskModal(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista de tareas localmente
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-6">Error: {error}</div>
  }

  const transformedTasks = tasks.map(task => {
    const priorityMap = {
      'low': 'baja',
      'medium': 'media',
      'high': 'alta'
    } as const;

    return {
      id: task.id,
      title: task.titulo,
      description: task.descripcion,
      area_id: task.area,
      area: task.area?.name || '',
      assigned_to: task.asignado_a?.[0] || null,
      priority: priorityMap[task.prioridad] || 'medium',
      status: task.estado,
      due_date: task.fecha || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })

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

        {userProfile && (
          <TaskModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            onSubmit={handleTaskSubmit}
            selectedDate={selectedDate}
            organizationId={userProfile.organization_id}
          />
        )}
      </div>
    </div>
  )
} 