'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { Database } from '@/lib/types/database'
import { Button } from '@/components/ui/button'

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

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: TaskInput) => void
  onDelete?: (taskId: string) => void
  task?: Task | null
  organizationId: string
}

interface Area {
  id: string
  name: string
  description: string | null
  organization_id: string
  parent_id: string | null
  status: 'active' | 'inactive'
  sala_id: string | null
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type TaskPriority = Database['public']['Tables']['tasks']['Row']['priority']
type TaskStatus = Database['public']['Tables']['tasks']['Row']['status']

export function TaskModal({ isOpen, onClose, onSave, onDelete, task, organizationId }: TaskModalProps) {
  const supabase = createClientComponentClient<Database>()

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState<string | undefined>(task?.description || undefined)
  const [dueDate, setDueDate] = useState<string | undefined>(task?.due_date || undefined)
  const [selectedArea, setSelectedArea] = useState<string | undefined>(task?.area_id || undefined)
  const [assignedTo, setAssignedTo] = useState<string | undefined>(task?.assigned_to || undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isCustomTask, setIsCustomTask] = useState(false)
  const [loading, setLoading] = useState({
    areas: false,
    users: false
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, users: true }))

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select()
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (usersError) {
          console.error('Error fetching users:', usersError)
          setError('Error al cargar los usuarios')
          return
        }

        setUsers(usersData || [])
      } catch (error) {
        console.error('Error en fetchData:', error)
      } finally {
        setLoading(prev => ({ ...prev, users: false }))
      }
    }

    fetchData()
  }, [organizationId])

  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(prev => ({ ...prev, areas: true }))

      try {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select()
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .order('name')

        if (areasError) {
          console.error('Error fetching areas:', areasError)
          setError('Error al cargar las áreas')
          return
        }

        const validAreas = areasData?.map(area => ({
          id: area.id,
          name: area.name,
          description: area.description,
          organization_id: area.organization_id,
          parent_id: area.parent_id,
          status: area.status as 'active' | 'inactive',
          sala_id: area.sala_id,
          created_at: area.created_at || new Date().toISOString(),
          updated_at: area.updated_at || new Date().toISOString()
        })) || []

        setAreas(validAreas)
      } catch (error) {
        console.error('Error en fetchAreas:', error)
      } finally {
        setLoading(prev => ({ ...prev, areas: false }))
      }
    }

    fetchAreas()
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!title) {
      alert('El título es requerido')
      return
    }

    const fullDescription = description ? 
      `${description}\n\nResponsable: ${assignedTo}` : 
      `Responsable: ${assignedTo}`

    const taskData: TaskInput = {
      title,
      description: fullDescription,
      due_date: dueDate || null,
      area_id: isCustomTask ? null : selectedArea || null,
      assigned_to: null,
      organization_id: organizationId,
      status: 'pending',
      priority: 'medium'
    }

    onSave(taskData)
    onClose()
  }

  const handleDelete = async () => {
    if (!task?.id) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      if (onDelete) {
        onDelete(task.id);
      }
      onClose();
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de tarea */}
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="customTask"
              checked={isCustomTask}
              onChange={(e) => setIsCustomTask(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="customTask" className="text-sm text-gray-700">
              Tarea adicional
            </label>
          </div>

          <input
            type="text"
            placeholder="Título de la tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />

          <textarea
            placeholder="Descripción"
            value={description || ''}
            onChange={(e) => setDescription(e.target.value || undefined)}
            className="w-full p-2 border rounded-lg h-24"
          />

          {!isCustomTask && (
            <div className="space-y-4">
              <SalaAreaSelector
                onAreaChange={(area) => setSelectedArea(area?.id || undefined)}
                onSalaChange={() => {}}
                className="space-y-2"
              />
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del responsable"
              value={assignedTo || ''}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />

            <input
              type="date"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || undefined)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-between space-x-2">
            {/* Botón de eliminar - solo visible al editar una tarea existente */}
            {task && onDelete && (
              <Button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                disabled={isSubmitting}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </Button>
            )}
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : task ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
