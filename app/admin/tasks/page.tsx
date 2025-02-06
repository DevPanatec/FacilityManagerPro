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
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string
  created_at: string
  due_date: string
  area_id: string
  organization_id: string
  assignee?: {
    first_name: string
    last_name: string
  }
  area?: {
    name: string
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [startTime, setStartTime] = useState<string>('')
  const [checklist, setChecklist] = useState<{ id: number; text: string; completed: boolean; }[]>([])
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
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autorizado')

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!userProfile) throw new Error('Perfil no encontrado')

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to (
            first_name,
            last_name
          ),
          area:area_id (
            name
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('assigned_to', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedTasks = data?.map(task => ({
        ...task,
        title: task.title || 'Sin título',
        description: task.description || 'Sin descripción',
        priority: task.priority || 'low',
        status: task.status || 'pending',
        area: task.area?.name || 'Sin área'
      })) || []

      setTasks(formattedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTask = async (task: Task) => {
    console.log('Iniciando tarea:', task);
    try {
      // Actualizar el estado de la tarea en Supabase
      console.log('Actualizando estado en Supabase...');
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress'
        })
        .eq('id', task.id);

      if (updateError) {
        console.error('Error de Supabase:', updateError);
        throw updateError;
      }

      // Crear lista de verificación desde la descripción de la tarea
      const taskItems = task.description.split('\n').filter(item => item.trim());
      const formattedChecklist = taskItems.map((text, index) => ({
        id: index + 1,
        text: text.trim(),
        completed: false
      }));

      // Actualizar el estado local
      setChecklist(formattedChecklist);
      setCurrentTask(task);
      setStartTime(new Date().toLocaleString());
      
      // Navegar a la página de tarea actual
      router.push('/admin/tasks/current');
      
      toast.success('Tarea iniciada exitosamente');
    } catch (error) {
      console.error('Error al iniciar la tarea:', error);
      toast.error('Error al iniciar la tarea');
    }
  };

  const handleToggleCheckItem = (id: number) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleGoBack = () => {
    setCurrentTask(null);
    setStartTime('');
  };

  // Renderizado condicional para tarea activa
  if (currentTask) {
    console.log('Renderizando vista de tarea activa:', currentTask);
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
        </div>
      </div>
    );
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Mis Asignaciones</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay asignaciones pendientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes tareas asignadas en este momento.
            </p>
          </div>
        ) : (
          tasks.map(task => (
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
                      <h3 className="font-semibold text-gray-800">{task.area?.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{task.title}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                    task.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.status === 'pending' ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completada
                      </>
                    )}
                  </span>
                </div>

                {/* Información adicional */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Creada: {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Vence: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleStartTask(task)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Iniciar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
} 