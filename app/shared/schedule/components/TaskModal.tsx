'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SalaAreaSelector, { Sala, Area } from '@/app/shared/components/componentes/SalaAreaSelector'
import type { Database } from '@/lib/types/database'
import { Task, TaskStatus } from './Calendar'

interface User {
  id: string
  first_name: string
  last_name: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: Partial<Task>) => Promise<void>
  task?: Task
}

export default function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    (task?.priority || 'medium') as 'low' | 'medium' | 'high'
  )
  const [status, setStatus] = useState<TaskStatus>(
    (task?.status || 'pending') as TaskStatus
  )
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '')
  const [users, setUsers] = useState<User[]>([])
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority((task.priority || 'medium') as 'low' | 'medium' | 'high')
      setStatus((task.status || 'pending') as TaskStatus)
      setDueDate(task.due_date || '')
      setAssignedTo(task.assigned_to || '')
      fetchData()
    }
  }, [task])

  const fetchData = async () => {
    if (!task) return
    try {
      // Obtener usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', task.organization_id)

      if (usersError) throw usersError
      if (usersData) {
        setUsers(usersData)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const taskData: Partial<Task> = {
        title,
        description,
        priority: priority as 'low' | 'medium' | 'high',
        status: status as TaskStatus,
        due_date: dueDate,
        assigned_to: assignedTo,
        area_id: selectedArea?.id
      }

      await onSave(taskData)
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Sala y Área */}
            <SalaAreaSelector
              onSalaChange={setSelectedSala}
              onAreaChange={setSelectedArea}
              defaultAreaId={task?.area_id}
            />

            {/* Prioridad y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Fecha de Vencimiento y Asignado a */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignado a
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
