'use client'
import { useState, useEffect } from 'react'
import { Database } from '@/lib/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Partial<Task>) => Promise<void>
  task?: Task | null
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const initialFormData: Partial<Task> = {
    title: '',
    description: '',
    due_date: new Date().toISOString(),
    priority: 'medium',
    status: 'pending',
    area_id: '',
    assigned_to: null
  }

  const [formData, setFormData] = useState<Partial<Task>>(initialFormData)
  const [areas, setAreas] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
        area_id: task.area_id,
        assigned_to: task.assigned_to
      })
    } else {
      setFormData(initialFormData)
    }
  }, [task])

  useEffect(() => {
    loadAreasAndUsers()
  }, [])

  const loadAreasAndUsers = async () => {
    try {
      const [areasResponse, usersResponse] = await Promise.all([
        supabase.from('areas').select('id, name'),
        supabase.from('users').select('id, first_name, last_name')
      ])

      if (areasResponse.error) throw areasResponse.error
      if (usersResponse.error) throw usersResponse.error

      setAreas(areasResponse.data || [])
      setUsers(usersResponse.data || [])
    } catch (error) {
      console.error('Error loading areas and users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {task ? 'Editar Tarea' : 'Nueva Tarea'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="datetime-local"
                value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 16) : ''}
                onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Área</label>
              <select
                value={formData.area_id || ''}
                onChange={e => setFormData(prev => ({ ...prev, area_id: e.target.value }))}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Seleccionar área</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prioridad</label>
              <select
                value={formData.priority || 'medium'}
                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                className="w-full border rounded p-2"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={formData.status || 'pending'}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                className="w-full border rounded p-2"
                required
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Asignado a</label>
            <select
              value={formData.assigned_to || ''}
              onChange={e => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full border rounded p-2"
            >
              <option value="">Sin asignar</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {`${user.first_name} ${user.last_name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
