'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: Database['public']['Tables']['tasks']['Insert']) => void
  task?: Database['public']['Tables']['tasks']['Row'] | null
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

export function TaskModal({ isOpen, onClose, onSave, task, organizationId }: TaskModalProps) {
  const supabase = createClientComponentClient<Database>()

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState<string | undefined>(task?.description || undefined)
  const [priority, setPriority] = useState<TaskPriority | undefined>(task?.priority || undefined)
  const [status, setStatus] = useState<TaskStatus | undefined>(task?.status || undefined)
  const [dueDate, setDueDate] = useState<string | undefined>(task?.due_date || undefined)
  const [selectedArea, setSelectedArea] = useState<string | undefined>(task?.area_id || undefined)
  const [assignedTo, setAssignedTo] = useState<string | undefined>(task?.assigned_to || undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [users, setUsers] = useState<User[]>([])
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

    const taskData: Database['public']['Tables']['tasks']['Insert'] = {
      title,
      description: description || null,
      priority: priority || 'medium',
      status: status || 'pending',
      due_date: dueDate || null,
      area_id: selectedArea || null,
      assigned_to: assignedTo || null,
      organization_id: organizationId,
    }

    onSave(taskData)
    onClose()
  }

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
          <input
            type="text"
            placeholder="Título de la tarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />

          <textarea
            placeholder="Descripción"
            value={description || ''}
            onChange={(e) => setDescription(e.target.value || undefined)}
            className="w-full p-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <select 
              value={priority || ''} 
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Prioridad</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>

            <select 
              value={status || ''} 
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Estado</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <input
            type="datetime-local"
            value={dueDate ? new Date(dueDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />

          <SalaAreaSelector
            defaultAreaId={task?.area_id || undefined}
            onAreaChange={(area: Area | null) => setSelectedArea(area?.id)}
          />

          <select
            value={assignedTo || ''}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Asignar a...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
