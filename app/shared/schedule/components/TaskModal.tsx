'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SalaAreaSelector from '@/app/shared/components/componentes/SalaAreaSelector'
import { Database } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [selectedSala, setSelectedSala] = useState<string | undefined>(task?.sala_id || undefined)
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'pending')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [startTime, setStartTime] = useState<string | undefined>(task?.start_time || undefined)
  const [endTime, setEndTime] = useState<string | undefined>(task?.end_time || undefined)
  const [estimatedHours, setEstimatedHours] = useState<string | undefined>(
    task?.estimated_hours ? String(task.estimated_hours) : undefined
  )
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

    // Obtener el usuario actual para asignarlo a la tarea
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    // Estructurar la descripción como se hace en asignaciones
    const taskDescription = description || ''

    // Solución definitiva para el problema de zona horaria: 
    // Agregar un día a la fecha para compensar la conversión a UTC
    let correctedDate = null;
    if (dueDate) {
      const localDate = new Date(dueDate);
      // Sumamos un día para compensar
      localDate.setDate(localDate.getDate() + 1);
      correctedDate = localDate.toISOString().split('T')[0];
      console.log('Fecha original:', dueDate, 'Fecha corregida:', correctedDate);
    }

    const taskData: TaskInput = {
      title,
      description: taskDescription,
      due_date: correctedDate,
      area_id: isCustomTask ? null : selectedArea || null, 
      assigned_to: currentUserId, // Asignar al usuario actual
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

  const resetForm = () => {
    setTitle('')
    setDescription(undefined)
    setDueDate(undefined)
    setSelectedArea(undefined)
    setSelectedSala(undefined)
    setStatus('pending' as TaskStatus)
    setPriority('medium' as TaskPriority)
    setStartTime(undefined)
    setEndTime(undefined)
    setEstimatedHours(undefined)
    setAssignedTo(undefined)
    setError(null)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('El título es requerido')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Solución definitiva para el problema de zona horaria: 
      // Agregar un día a la fecha para compensar la conversión a UTC
      let correctedDate = null;
      if (dueDate) {
        const localDate = new Date(dueDate);
        // Sumamos un día para compensar
        localDate.setDate(localDate.getDate() + 1);
        correctedDate = localDate.toISOString().split('T')[0];
      }

      const newTask: TaskInput = {
        id: task?.id,
        organization_id: organizationId,
        title,
        description: description || null,
        status,
        priority,
        due_date: correctedDate,
        start_time: startTime || null,
        end_time: endTime || null,
        estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        assigned_to: assignedTo || null,
        area_id: isCustomTask ? null : selectedArea || null,
        sala_id: selectedSala || null,
        type: 'calendar_task', // Identificador para saber que fue creada desde el calendario
      }

      await onSave(newTask)
      // Resetear campos solo si es una nueva tarea
      if (!task) {
        resetForm()
      }
      onClose()
    } catch (err) {
      console.error('Error saving task:', err)
      setError('Error al guardar la tarea. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Definir variantes de animación para el modal
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  // Variantes para elementos dentro del formulario
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.3
      }
    })
  };

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
              <h2 className="text-white text-xl font-semibold">{task?.id ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
                  <label className="block font-medium text-sm mb-1">Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título de la tarea"
                    required
                  />
                </motion.div>

                <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
                  <label className="block font-medium text-sm mb-1">Descripción</label>
                  <textarea
                    value={description || ''}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción de la tarea"
                  />
                </motion.div>

                <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
                  <label className="block font-medium text-sm mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={dueDate || ''}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>

                <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isCustomTask"
                      checked={isCustomTask}
                      onChange={(e) => setIsCustomTask(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="isCustomTask" className="text-sm">Tarea personalizada</label>
                  </div>
                </motion.div>

                {!isCustomTask && (
                  <motion.div 
                    custom={4} 
                    variants={itemVariants} 
                    initial="hidden" 
                    animate="visible"
                    className="space-y-3"
                  >
                    <label className="block font-medium text-sm">Ubicación</label>
                    <SalaAreaSelector
                      onSalaChange={(sala) => setSelectedSala(sala?.id)}
                      onAreaChange={(area) => setSelectedArea(area?.id)}
                      defaultSalaId={selectedSala}
                      defaultAreaId={selectedArea}
                    />
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    className="bg-red-100 p-3 rounded-md border border-red-300 text-red-800 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                {task?.id && onDelete && (
                  <motion.button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Eliminar
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
