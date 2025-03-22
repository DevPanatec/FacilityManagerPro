'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Calendar from '@/app/shared/schedule/components/Calendar'
import TaskModal from './components/TaskModal'
import { Database } from '@/lib/types/database'
import { taskService } from '@/app/services/taskService'
import { toast } from 'react-hot-toast'

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high'

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

interface CustomError {
  message: string;
}

export default function EnterpriseSchedulePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
          .from('users')
          .select('*, organizations(*)')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        console.log('User profile loaded:', profile)
        setUserProfile(profile)

        // 3. Cargar tareas usando el servicio compartido para garantizar consistencia
        const allTasks = await taskService.loadAllTasks();
        console.log('Tareas cargadas con servicio compartido para el Calendario de Empresa:', allTasks);
        
        // Formatear las tareas para incluir assignee en el formato esperado por el calendario
        const formattedTasks = allTasks.map(task => ({
          ...task,
          assignee: task.users ? {
            first_name: task.users.first_name,
            last_name: task.users.last_name
          } : undefined,
          area: task.areas ? {
            id: task.areas.id,
            name: task.areas.name
          } : null
        }));

        setTasks(formattedTasks || [])
        setLoading(false)
      } catch (error: unknown) {
        console.error('Error fetching data:', error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('Error desconocido al cargar los datos')
        }
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
        table: 'tasks',
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
      // Obtener el usuario actual para asignar la tarea
      const { data: { user } } = await supabase.auth.getUser()
      
      // Procesar la fecha para asegurarnos que esté en formato correcto
      let dueDate = null;
      
      if (taskData.fecha) {
        // Convertir a Date y luego a formato ISO para eliminar problemas de zona horaria
        const localDate = new Date(taskData.fecha);
        dueDate = localDate.toISOString().split('T')[0];
      } else if (selectedDate) {
        // Si no hay fecha en los datos pero hay una fecha seleccionada
        const localDate = new Date(selectedDate);
        dueDate = localDate.toISOString().split('T')[0];
      } else {
        // Si no hay ninguna fecha, usar la fecha actual
        dueDate = new Date().toISOString().split('T')[0];
      }
      
      console.log('Fecha final para la tarea:', dueDate);
      
      // Preparar los datos de la tarea
      const taskPayload = {
        title: taskData.titulo,
        description: taskData.descripcion || '',
        area_id: taskData.area_id,
        status: 'pending',
        priority: 'medium',
        assigned_to: user?.id,
        due_date: dueDate,
        organization_id: userProfile.organization_id,
        created_by: user?.id,
        type: 'calendar'  // Establecer tipo calendar para que aparezca en el calendario
      };
      
      // Insertar la tarea en la base de datos
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskPayload])
        .select()

      if (error) throw error

      toast.success('Tarea creada correctamente');
      
      // Obtener todas las tareas nuevamente para reflejar los cambios
      const allTasks = await taskService.loadAllTasks();
      console.log('Tareas actualizadas después de crear:', allTasks);
      
      // Formatear para la visualización en el calendario
      const formattedTasks = allTasks.map(task => ({
        ...task,
        assignee: task.users ? {
          first_name: task.users.first_name,
          last_name: task.users.last_name
        } : undefined,
        area: task.areas ? {
          id: task.areas.id,
          name: task.areas.name
        } : null
      }));

      // Actualizar el estado con todas las tareas
      setTasks(formattedTasks);
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error al crear la tarea');
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

  const transformedTasks = tasks.map(task => ({
    ...task,
    organization: userProfile?.organization ? {
      id: userProfile.organization.id,
      name: userProfile.organization.name
    } : undefined,
    area_id: task.area_id || null,
    due_date: task.due_date || null,
    start_time: task.start_time || null,
    end_time: task.end_time || null,
    type: task.type || null,
    frequency: task.frequency || null,
    sala_id: task.sala_id || null,
    parent_task_id: task.parent_task_id || null,
    order: task.order || null,
    estimated_hours: task.estimated_hours || null
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