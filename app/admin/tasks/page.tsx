'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

      let query = supabase
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
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-6">
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