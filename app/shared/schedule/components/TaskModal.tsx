'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Task } from '@/lib/types/tasks'
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { Sala, Area } from '@/lib/types/database'

interface User {
  id: string
  first_name: string
  last_name: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: Partial<Task>) => Promise<void>
  task?: Task | null
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium')
  const [status, setStatus] = useState<Task['status']>(task?.status || 'pending')
  const [dueDate, setDueDate] = useState(task?.due_date || new Date().toISOString().split('T')[0])
  const [selectedSala, setSelectedSala] = useState(task?.sala_id || '')
  const [selectedArea, setSelectedArea] = useState(task?.area_id || '')
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '')
  const [startTime, setStartTime] = useState(task?.start_time || '')
  const [endTime, setEndTime] = useState(task?.end_time || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salas, setSalas] = useState<Sala[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState({
    salas: false,
    areas: false,
    users: false
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!task?.organization_id) {
        return
      }

      setLoading(prev => ({ ...prev, salas: true, users: true }))

      try {
        // Obtener salas
        const { data: salasData, error: salasError } = await supabase
          .from('salas')
          .select('id, nombre, estado, organization_id')
          .eq('organization_id', task.organization_id)
          .eq('estado', true)
          .order('nombre')

        if (salasError) {
          console.error('Error fetching salas:', salasError)
          setError('Error al cargar las salas')
          return
        }

        setSalas(salasData || [])

        // Obtener usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('organization_id', task.organization_id)
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
        setLoading(prev => ({ ...prev, salas: false, users: false }))
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, task])

  // Efecto para cargar áreas cuando se selecciona una sala
  useEffect(() => {
    const fetchAreas = async () => {
      if (!selectedSala) {
        setAreas([])
        return
      }

      setLoading(prev => ({ ...prev, areas: true }))

      try {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('id, name, sala_id, status, organization_id')
          .eq('organization_id', task?.organization_id)
          .eq('sala_id', selectedSala)
          .eq('status', 'active')
          .order('name')

        if (areasError) {
          console.error('Error fetching areas:', areasError)
          setError('Error al cargar las áreas')
          return
        }

        setAreas(areasData || [])
      } catch (error) {
        console.error('Error en fetchAreas:', error)
      } finally {
        setLoading(prev => ({ ...prev, areas: false }))
      }
    }

    fetchAreas()
  }, [selectedSala, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validar campos requeridos
      if (!title.trim()) {
        throw new Error('El título es requerido')
      }

      if (!selectedArea) {
        throw new Error('Debe seleccionar un área')
      }

      if (!dueDate) {
        throw new Error('La fecha de vencimiento es requerida')
      }

      // Crear objeto de tarea
      const taskData: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        due_date: dueDate,
        area_id: selectedArea,
        sala_id: selectedSala || undefined,
        assigned_to: assignedTo || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined
      }

      await onSave(taskData)
      onClose()
    } catch (err) {
      console.error('Error al guardar la tarea:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea')
    } finally {
      setIsSubmitting(false)
    }
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de vencimiento</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora de inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora de fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <SalaAreaSelector
            onSalaChange={(sala) => setSelectedSala(sala?.id || '')}
            onAreaChange={(area) => setSelectedArea(area?.id || '')}
            initialSalaId={selectedSala}
            initialAreaId={selectedArea}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{task ? 'Actualizar' : 'Crear'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
