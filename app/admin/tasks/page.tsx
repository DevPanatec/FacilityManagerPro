'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string
  created_at: string
  due_date: string
  area_id: string
  organization_id: string
  start_time?: string
  end_time?: string
  type?: string
  start_date?: string
  sala_id?: string
  assignee?: {
    first_name: string
    last_name: string
  }
  area?: {
    name: string
    sala?: {
      id: string
      nombre: string
    }
  }
  sala?: {
    id: string
    nombre: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    pending: 0,
    inProgress: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [startTime, setStartTime] = useState<string>('')
  const [checklist, setChecklist] = useState<{ id: number; text: string; completed: boolean; }[]>([])
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      console.log('Página enfocada, recargando tareas...')
      fetchTasks()
    }

    window.addEventListener('focus', handleFocus)
    
    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Cambio detectado en tareas:', payload)
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('focus', handleFocus)
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Error de autenticación:', authError)
        throw new Error('Error de autenticación: ' + authError.message)
      }
      if (!user) throw new Error('No autorizado - Usuario no encontrado')

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error al obtener perfil:', profileError)
        throw new Error('Error al obtener perfil: ' + profileError.message)
      }
      if (!userProfile) throw new Error('Perfil no encontrado')

      // Verificar roles
      const isAdmin = userProfile.role === 'admin'
      const isTech = userProfile.role === 'tech'
      
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          start_date,
          start_time,
          due_date,
          type,
          organization_id,
          installation_id,
          assigned_to,
          sala_id,
          area_id,
          users!tasks_assigned_to_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          salas (
            id,
            nombre,
            estado
          ),
          areas (
            id,
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
      
      // Si es técnico, mostrar solo sus tareas
      if (isTech) {
        query = query.eq('assigned_to', user.id)
      }
      
      // Filtrar por instalación si está seleccionada
      if (selectedInstallation) {
        query = query.eq('installation_id', selectedInstallation)
      }
      
      // Filtrar por sala si está seleccionada
      if (selectedRoom) {
        query = query.eq('sala_id', selectedRoom)
      }
      
      // Filtrar por estado si está seleccionado
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }
      
      // Filtrar por fecha
      if (filterDate) {
        const nextDay = new Date(filterDate)
        nextDay.setDate(nextDay.getDate() + 1)
        query = query.gte('start_date', filterDate).lt('start_date', nextDay.toISOString().split('T')[0])
      }
      
      // Filtrar por tipo - Asegurar que se incluyan 'calendar' y 'assignment'
      // Esto permite que las tareas creadas como asignaciones aparezcan en la sección de tareas
      query = query.or(`type.eq.calendar,type.eq.assignment`)
      
      // Ordenar por fecha de creación
      query = query.order('created_at', { ascending: false })
      
      const { data: tasksData, error: tasksError } = await query
      
      if (tasksError) {
        console.error('Error buscando tareas:', tasksError)
        throw new Error('Error al obtener tareas: ' + tasksError.message)
      }
      
      console.log('Tareas cargadas:', tasksData?.length || 0)

      const formattedTasks = tasksData?.map(task => {
        // Ensure assignee is properly typed
        const assignee = task.assignee && Array.isArray(task.assignee) && task.assignee[0] ? {
          first_name: task.assignee[0].first_name,
          last_name: task.assignee[0].last_name
        } : (task.assigned_to ? { first_name: "Sin nombre", last_name: "disponible" } : undefined)

        // Ensure area is properly typed
        const area = task.area && Array.isArray(task.area) && task.area[0] ? {
          name: task.area[0].name || 'Área sin identificar'
        } : (task.area_id ? { name: "Limpieza/Mantenimiento" } : undefined)
        
        // Ensure sala is properly typed
        const sala = task.sala && Array.isArray(task.sala) && task.sala[0] ? {
          id: task.sala[0].id,
          nombre: task.sala[0].nombre
        } : undefined

        return {
          ...task,
          assignee,
          area,
          sala
        } as Task
      }) || []

      console.log('Tareas formateadas:', formattedTasks)

      // Actualizar estadísticas usando los valores de status directly
      const stats = {
        completed: formattedTasks?.filter(t => t.status === 'completed').length || 0,
        pending: formattedTasks?.filter(t => t.status === 'pending').length || 0,
        inProgress: formattedTasks?.filter(t => t.status === 'in_progress').length || 0
      }

      console.log('Estadísticas calculadas:', stats)

      setTaskStats(stats)
      setTasks(formattedTasks)
    } catch (error: any) {
      console.error('Error fetching tasks:', {
        message: error.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      })
      toast.error(error.message || 'Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTask = async (task: Task) => {
    try {
      // Deshabilitar el botón inmediatamente
      const button = document.querySelector(`button[data-task-id="${task.id}"]`)
      if (button) {
        button.setAttribute('disabled', 'true')
      }

      // Mostrar indicador de carga con ID
      const toastId = toast.loading('Iniciando tarea...')

      // 1. Obtener usuario y verificar tarea en paralelo
      const [userResponse, checkTaskResponse] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('tasks')
          .select('*')
          .eq('id', task.id)
          .single()
      ])

      if (!userResponse.data.user) throw new Error('No autorizado')
      if (!checkTaskResponse.data) throw new Error('Tarea no encontrada')

      // Verificar si la tarea ya está en progreso
      if (checkTaskResponse.data.status === 'in_progress') {
        toast.dismiss(toastId)
        toast.error('Esta tarea ya está en progreso')
        router.push('/admin/tasks/current')
        return
      }

      // 2. Actualizar la tarea
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { hour12: false })
      
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          start_time: timeString,
          updated_at: now.toISOString(),
          assigned_to: userResponse.data.user.id
        })
        .eq('id', task.id)
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey (
            first_name,
            last_name
          ),
          area:areas!tasks_area_id_fkey (
            name,
            sala:salas (
              id,
              nombre
            )
          )
        `)
        .single()

      if (updateError) throw updateError
      if (!updatedTask) throw new Error('No se pudo actualizar la tarea')

      // 3. Actualizar estado local
      const formattedTask = {
        ...updatedTask,
        title: updatedTask.title || 'Sin título',
        description: updatedTask.description || 'Sin descripción',
        priority: updatedTask.priority || 'low',
        status: 'in_progress',
        assignee: updatedTask.assignee?.[0] ? {
          first_name: updatedTask.assignee[0].first_name,
          last_name: updatedTask.assignee[0].last_name
        } : undefined,
        area: updatedTask.area?.[0] ? {
          name: updatedTask.area[0].name,
          sala: updatedTask.area[0].sala?.[0] ? {
            id: updatedTask.area[0].sala[0].id,
            nombre: updatedTask.area[0].sala[0].nombre
          } : undefined
        } : undefined
      }

      // Actualizar el estado local
      setTasks(prevTasks =>
        prevTasks.map(t => t.id === task.id ? formattedTask : t)
      )

      setTaskStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        inProgress: prev.inProgress + 1
      }))

      // Limpiar toast y mostrar éxito
      toast.dismiss(toastId)
      toast.success('Tarea iniciada con éxito')

      // Redirigir inmediatamente a la página de tarea actual
      router.push('/admin/tasks/current')

    } catch (error: any) {
      console.error('Error detallado:', {
        message: error.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      toast.error(error.message || 'Error al iniciar la tarea')
      
      // Re-habilitar el botón en caso de error
      const button = document.querySelector(`button[data-task-id="${task.id}"]`)
      if (button) {
        button.removeAttribute('disabled')
      }
    }
  }

  const handleToggleCheckItem = (id: number) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const handleGoBack = () => {
    setCurrentTask(null)
    setStartTime('')
  }

  const handleCompleteTask = async (task: Task) => {
    try {
      // 1. Obtener el usuario y su perfil
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!userProfile) throw new Error('Perfil no encontrado')

      // 2. Actualizar la tarea
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { hour12: false })
      
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          end_time: timeString,
          updated_at: now.toISOString()
        })
        .match({
          id: task.id,
          organization_id: userProfile.organization_id
        })
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey (
            first_name,
            last_name
          ),
          area:areas!tasks_area_id_fkey (
            name
          )
        `)
        .single()

      if (updateError) {
        console.error('Error de actualización:', updateError)
        throw updateError
      }

      if (!updatedTask) throw new Error('No se pudo actualizar la tarea')

      // 3. Actualizar el estado local
      const formattedTask = {
        ...updatedTask,
        title: updatedTask.title || 'Sin título',
        description: updatedTask.description || 'Sin descripción',
        priority: updatedTask.priority || 'low',
        status: updatedTask.status || 'completed',
        area: updatedTask.area?.name || 'Sin área'
      }

      setTasks(prevTasks =>
        prevTasks.map(t => t.id === task.id ? formattedTask : t)
      )

      // 4. Actualizar estadísticas
      setTaskStats(prev => ({
        ...prev,
        inProgress: Math.max(0, prev.inProgress - 1),
        completed: prev.completed + 1
      }))

      toast.success('Tarea completada con éxito')
      router.push('/admin/tasks')

    } catch (error: any) {
      console.error('Error detallado:', {
        message: error.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      toast.error(error.message || 'Error al completar la tarea')
    }
  }

  const handleContinueTask = async (task: Task) => {
    try {
      // Mostrar indicador de carga
      const toastId = toast.loading('Cargando tarea...')

      // Obtener datos actualizados de la tarea
      const { data: taskData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:users!tasks_assigned_to_fkey (
            first_name,
            last_name
          ),
          area:areas!tasks_area_id_fkey (
            name,
            sala:salas (
              id,
              nombre
            )
          )
        `)
        .eq('id', task.id)
        .single()

      if (error) {
        toast.dismiss(toastId)
        toast.error('Error al cargar la tarea: ' + error.message)
        return
      }

      if (!taskData) {
        toast.dismiss(toastId)
        toast.error('No se encontró la tarea')
        return
      }

      toast.dismiss(toastId)
      toast.success('Tarea cargada con éxito')

      // Redirigir a la página de tarea actual
      router.push('/admin/tasks/current')
    } catch (error: any) {
      console.error('Error al continuar la tarea:', error)
      toast.error(error.message || 'Error al continuar la tarea')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Actualizar el estado local
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
      
      // Actualizar estadísticas
      setTaskStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1)
      }))

      toast.success('Tarea eliminada correctamente')
    } catch (error) {
      console.error('Error al eliminar la tarea:', error)
      toast.error('Error al eliminar la tarea')
    }
  }

  // Renderizado condicional para tarea activa
  if (currentTask) {
    console.log('Renderizando vista de tarea activa:', currentTask)
    return (
      <div className="min-h-screen bg-white">
        {/* Header azul con la información de la tarea */}
        <div className="bg-[#4263eb] text-white p-4">
          <div className="max-w-3xl mx-auto">
            {/* Botón Regresar */}
            <button
              onClick={handleGoBack}
              className="flex items-center text-white mb-4 hover:text-blue-100"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Regresar
            </button>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-medium mb-2">{currentTask.area?.name}</h1>
                <p className="text-lg font-normal">{currentTask.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                  Prioridad Alta
                </span>
                <span className="text-blue-200 text-sm">
                  ID: {currentTask.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-3xl mx-auto p-6">
          {/* Hora de inicio */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">Hora de inicio</span>
            </div>
            <p className="text-xl font-medium">
              {startTime}
            </p>
          </div>

          {/* Lista de verificación */}
          <div>
            <h3 className="text-gray-600 mb-4">Lista de verificación</h3>
            <div className="space-y-3">
              {checklist.map(item => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleCheckItem(item.id)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600"
                  />
                  <span className={`text-gray-700 ${item.completed ? 'line-through' : ''}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de completar */}
          <div className="mt-8">
            <button
              onClick={() => handleCompleteTask(currentTask)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Marcar como completada
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Vista normal de lista de tareas
  return (
    <main className="container mx-auto px-4 py-6">
      {/* Navbar secundario */}
      <div className="mb-6 border-b">
        <nav className="flex space-x-8">
          <Link
            href="/admin/tasks"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              pathname === '/admin/tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Asignaciones
          </Link>
          <Link
            href="/admin/tasks/current"
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              pathname === '/admin/tasks/current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tarea Actual
          </Link>
        </nav>
      </div>

      {/* Estado de las tareas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-600">Completadas</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{taskStats.completed}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm font-medium text-gray-600">Pendientes</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{taskStats.pending}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm font-medium text-gray-600">En Progreso</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{taskStats.inProgress}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Tareas Asignadas</h1>
          
          {/* Interruptor para cambiar entre mis tareas y todas las tareas */}
          <div className="flex items-center ml-4">
            <button
              onClick={() => {
                setShowAllTasks(!showAllTasks)
                // Recargar tareas cuando cambie el toggle
                setTimeout(() => fetchTasks(), 100)
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                showAllTasks 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {showAllTasks ? 'Todas las tareas' : 'Solo mis tareas'}
            </button>
        </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full" onClick={fetchTasks}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeFilter === 'all' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            activeFilter === 'pending' 
              ? 'bg-orange-500 text-white' 
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Pendientes ({taskStats.pending})
        </button>
        <button
          onClick={() => setActiveFilter('in_progress')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            activeFilter === 'in_progress' 
              ? 'bg-blue-500 text-white' 
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          En Progreso ({taskStats.inProgress})
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            activeFilter === 'completed' 
              ? 'bg-green-500 text-white' 
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Completadas ({taskStats.completed})
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas asignadas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay tareas asignadas en este momento.
            </p>
          </div>
        ) : (
          <>
            {/* Filtrar y renderizar tareas */}
            {tasks
              .filter(task => 
                activeFilter === 'all' ? true : 
                activeFilter === 'pending' ? task.status === 'pending' : 
                activeFilter === 'in_progress' ? task.status === 'in_progress' : 
                activeFilter === 'completed' ? task.status === 'completed' : 
                true
              )
              // Eliminar duplicados basados en título y área
              .filter((task, index, self) => 
                index === self.findIndex(t => 
                  t.title === task.title && 
                  t.area?.name === task.area?.name &&
                  t.sala?.nombre === task.sala?.nombre
                )
              )
              .sort((a, b) => {
                // Prioridad de ordenamiento:
                // Si estamos mostrando todas las tareas, ordenar por estado primero
                if (activeFilter === 'all') {
                  // Primero ordenar por estado
                  if (a.status !== b.status) {
                    // Pendientes primero
                    if (a.status === 'pending') return -1
                    if (b.status === 'pending') return 1
                    
                    // Luego en progreso
                    if (a.status === 'in_progress') return -1
                    if (b.status === 'in_progress') return 1
                    
                    // Completadas al final
                    if (a.status === 'completed') return 1
                    if (b.status === 'completed') return -1
                  }
                }
                
                // Para todos los casos (con o sin filtro por estado):
                // Ordenar por fecha programada (más recientes primero)
                const aDate = a.start_date ? new Date(a.start_date).getTime() : 0
                const bDate = b.start_date ? new Date(b.start_date).getTime() : 0
                
                // Si ambas tienen start_date, comparar por esa fecha (más reciente primero)
                if (aDate && bDate) {
                  return bDate - aDate
                }
                
                // Si solo una tiene start_date, esa va primero
                if (aDate) return -1
                if (bDate) return 1
                
                // Si ninguna tiene start_date, ordenar por fecha de creación
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              })
              .map(task => (
            <div 
              key={task.id} 
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5">
                {/* Encabezado con área y prioridad */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                          <h3 className="font-semibold text-gray-800">
                            {task.type === 'assignment' && task.sala 
                              ? `${task.sala.nombre} - ${task.area?.name || ''}` 
                              : (task.area?.name || '')}
                          </h3>
                    </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.title}
                        </p>
                        
                        {/* Mostrar fecha programada para asignaciones */}
                        {task.type === 'assignment' && task.start_date && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Programada: {new Date(task.start_date).toLocaleDateString()} 
                            {task.start_time && ` a las ${task.start_time}`}
                          </p>
                        )}
                        
                        {/* Mostrar asignado a - especialmente útil para tareas del calendario */}
                        <p className="text-xs text-gray-500 mt-1">
                          {task.assignee && task.assignee.first_name && task.assignee.last_name ? 
                            `Asignado a: ${task.assignee.first_name} ${task.assignee.last_name}` : 
                            ''}
                        </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                  }`}>
                    {task.status === 'completed' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completada
                      </>
                    ) : task.status === 'pending' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente
                      </>
                        ) : task.status === 'in_progress' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        En Progreso
                      </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelada
                      </>
                    )}
                  </span>
                </div>

                {/* Información adicional */}
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      {task.due_date && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                            Fecha límite: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                      )}
                </div>

                    {task.description && (
                      <div className="mb-4 text-sm text-gray-600 line-clamp-2">
                        {task.description}
                      </div>
                    )}

                {/* Botones de acción */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="inline-flex items-center px-3 py-2 mr-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200"
                    title="Eliminar tarea"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                      {task.status === 'pending' && (
                  <button
                    data-task-id={task.id}
                    onClick={() => handleStartTask(task)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Iniciar
                  </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          data-task-id={task.id}
                          onClick={() => handleContinueTask(task)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Continuar
                        </button>
                      )}
                </div>
              </div>
            </div>
          ))
            }
          </>
        )}
      </div>
    </main>
  )
} 