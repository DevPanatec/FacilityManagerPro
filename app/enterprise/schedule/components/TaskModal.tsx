'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Sala {
  id: string
  nombre: string
  status: 'active' | 'inactive'
  organization_id: string
  created_at?: string
  updated_at?: string
}

interface Area {
  id: string
  name: string
  description?: string | null
  organization_id: string
  sala_id: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  organization_id: string | null
  status: 'active' | 'inactive' | 'pending'
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => void
  selectedDate: string
  organizationId: string
}

export default function TaskModal({ isOpen, onClose, onSubmit, selectedDate, organizationId }: TaskModalProps) {
  const supabase = createClientComponentClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSala, setSelectedSala] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [priority, setPriority] = useState('media')
  const [status, setStatus] = useState('pendiente')
  const [assignedTo, setAssignedTo] = useState('')
  const [salas, setSalas] = useState<Sala[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState({
    salas: false,
    areas: false,
    users: false
  })
  const [error, setError] = useState<{
    salas: string | null,
    areas: string | null,
    users: string | null
  }>({
    salas: null,
    areas: null,
    users: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, salas: true, users: true }))
      setError(prev => ({ ...prev, salas: null, users: null }))

      try {
        // Obtener salas de la organización
        const { data: salasData, error: salasError } = await supabase
          .from('salas')
          .select('id, nombre, status, organization_id')
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (salasError) throw salasError
        setSalas(salasData || [])
      } catch (error) {
        console.error('Error fetching salas:', error)
        setError(prev => ({ ...prev, salas: 'Error al cargar las salas' }))
      } finally {
        setLoading(prev => ({ ...prev, salas: false }))
      }

      try {
        // Obtener usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, organization_id, status')
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (usersError) throw usersError
        setUsers(usersData || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        setError(prev => ({ ...prev, users: 'Error al cargar los usuarios' }))
      } finally {
        setLoading(prev => ({ ...prev, users: false }))
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, organizationId])

  const handleSalaChange = async (salaId: string) => {
    setSelectedSala(salaId)
    setSelectedArea('')
    
    if (salaId) {
      setLoading(prev => ({ ...prev, areas: true }))
      setError(prev => ({ ...prev, areas: null }))

      try {
        // Primero obtener la sala para verificar que esté activa
        const { data: salaData, error: salaError } = await supabase
          .from('salas')
          .select('id')
          .eq('id', salaId)
          .eq('status', 'active')
          .single()

        if (salaError) throw salaError
        if (!salaData) throw new Error('Sala no encontrada o inactiva')

        // Luego obtener las áreas de esa sala
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('id, name, sala_id, organization_id, status')
          .eq('organization_id', organizationId)
          .eq('sala_id', salaId)
          .eq('status', 'active')

        if (areasError) throw areasError
        setAreas(areasData || [])
      } catch (error) {
        console.error('Error fetching areas:', error)
        setError(prev => ({ ...prev, areas: 'Error al cargar las áreas' }))
        setAreas([])
      } finally {
        setLoading(prev => ({ ...prev, areas: false }))
      }
    } else {
      setAreas([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validaciones
    if (!title.trim()) {
      setError(prev => ({ ...prev, salas: 'El título es requerido' }))
      return
    }

    if (!selectedSala) {
      setError(prev => ({ ...prev, salas: 'Debe seleccionar una sala' }))
      return
    }

    if (!selectedArea) {
      setError(prev => ({ ...prev, areas: 'Debe seleccionar un área' }))
      return
    }

    setIsSubmitting(true)

    try {
      // Crear la tarea
      const taskData = {
        titulo: title.trim(),
        descripcion: description.trim(),
        sala_id: selectedSala,
        area_id: selectedArea,
        fecha: selectedDate,
        prioridad: priority,
        status: status,
        asignado_a: assignedTo ? [assignedTo] : [],
        organization_id: organizationId
      }

      await onSubmit(taskData)

      // Limpiar el formulario
      setTitle('')
      setDescription('')
      setSelectedSala('')
      setSelectedArea('')
      setPriority('media')
      setStatus('pendiente')
      setAssignedTo('')
      
      onClose()
    } catch (error) {
      console.error('Error al crear la tarea:', error)
      setSubmitError('Error al crear la tarea. Por favor, intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nueva Tarea</h2>
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

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {submitError}
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
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="datetime-local"
              value={selectedDate}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sala</label>
            <select
              value={selectedSala}
              onChange={(e) => handleSalaChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={loading.salas}
            >
              <option value="">
                {loading.salas ? 'Cargando salas...' : 'Seleccionar sala'}
              </option>
              {salas.map(sala => (
                <option key={sala.id} value={sala.id}>{sala.nombre}</option>
              ))}
            </select>
            {error.salas && (
              <p className="mt-1 text-sm text-red-600">{error.salas}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={loading.areas || !selectedSala}
            >
              <option value="">
                {loading.areas ? 'Cargando áreas...' : 'Seleccionar área'}
              </option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            {error.areas && (
              <p className="mt-1 text-sm text-red-600">{error.areas}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Asignado a</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading.users}
            >
              <option value="">
                {loading.users ? 'Cargando usuarios...' : 'Sin asignar'}
              </option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
            {error.users && (
              <p className="mt-1 text-sm text-red-600">{error.users}</p>
            )}
          </div>

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
                  <span>Creando...</span>
                </>
              ) : (
                <span>Crear</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 