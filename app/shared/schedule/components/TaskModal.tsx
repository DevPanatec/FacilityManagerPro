'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Sala {
  id: string
  nombre: string
  estado: boolean
  organization_id: string
}

interface Area {
  id: string
  name: string
  sala_id: string
  status: 'active' | 'inactive'
  organization_id: string
}

interface User {
  id: string
  first_name: string
  last_name: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => void
  selectedDate: string
  organizationId: string
}

export function TaskModal({ isOpen, onClose, onSubmit, selectedDate, organizationId }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('media')
  const [status, setStatus] = useState('pendiente')
  const [assignedTo, setAssignedTo] = useState('')
  const [selectedSala, setSelectedSala] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
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

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        return
      }

      setLoading(prev => ({ ...prev, salas: true, users: true }))
      setError(prev => ({ ...prev, salas: null, users: null }))

      try {
        // Obtener salas
        const { data: salasData, error: salasError } = await supabase
          .from('salas')
          .select('id, nombre, estado, organization_id')
          .eq('organization_id', organizationId)
          .eq('estado', true)
          .order('nombre')

        if (salasError) {
          console.error('Error fetching salas:', salasError)
          setError(prev => ({ ...prev, salas: 'Error al cargar las salas' }))
          return
        }

        setSalas(salasData || [])

        // Obtener usuarios
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        if (usersError) {
          console.error('Error fetching users:', usersError)
          setError(prev => ({ ...prev, users: 'Error al cargar los usuarios' }))
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
  }, [isOpen, organizationId])

  // Efecto para cargar áreas cuando se selecciona una sala
  useEffect(() => {
    const fetchAreas = async () => {
      if (!selectedSala) {
        setAreas([])
        return
      }

      setLoading(prev => ({ ...prev, areas: true }))
      setError(prev => ({ ...prev, areas: null }))

      try {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select('id, name, sala_id, status, organization_id')
          .eq('organization_id', organizationId)
          .eq('sala_id', selectedSala)
          .eq('status', 'active')
          .order('name')

        if (areasError) {
          console.error('Error fetching areas:', areasError)
          setError(prev => ({ ...prev, areas: 'Error al cargar las áreas' }))
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
  }, [selectedSala, organizationId])

  const handleSalaChange = (salaId: string) => {
    setSelectedSala(salaId)
    setSelectedArea('') // Resetear el área seleccionada cuando cambia la sala
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSala) {
      setError(prev => ({ ...prev, salas: 'Debe seleccionar una sala' }))
      return
    }

    if (!selectedArea) {
      setError(prev => ({ ...prev, areas: 'Debe seleccionar un área' }))
      return
    }

    onSubmit({
      titulo: title,
      descripcion: description,
      sala_id: selectedSala,
      area_id: selectedArea,
      fecha: selectedDate,
      prioridad: priority,
      status: status,
      asignado_a: assignedTo ? [assignedTo] : [],
      organization_id: organizationId
    })
    onClose()
  }

  if (!isOpen || !organizationId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Nueva Tarea</h2>
        
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
