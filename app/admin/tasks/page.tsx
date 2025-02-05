'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  const supabase = createClientComponentClient()
  const pathname = usePathname()

  useEffect(() => {
    fetchTasks()
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
          <p className="text-center text-gray-500 py-4">Cargando asignaciones...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay asignaciones pendientes</p>
        ) : (
          tasks.map(task => (
            <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">{task.area?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Fecha límite: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Iniciar
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  )
} 