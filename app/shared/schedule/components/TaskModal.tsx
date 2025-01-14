'use client'
import { useState, useEffect } from 'react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Omit<ScheduledTask, 'id'>) => void
  task?: ScheduledTask
  initialDate?: string
  users: { id: string; name: string }[]
  areas: { id: string; name: string }[]
}

interface ScheduledTask {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  area: string
  shift: 'A' | 'B' | 'C'
  status: 'pending' | 'completed' | 'cancelled'
  assignedTo: string[]
}

export default function TaskModal({ isOpen, onClose, onSubmit, task, initialDate, users, areas }: TaskModalProps) {
  const initialFormData = {
    title: '',
    description: '',
    date: initialDate || '',
    startTime: '',
    endTime: '',
    area: '',
    shift: 'A',
    status: 'pending',
    assignedTo: []
  }

  const [formData, setFormData] = useState<Omit<ScheduledTask, 'id'>>(initialFormData)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        date: task.date,
        startTime: task.startTime,
        endTime: task.endTime,
        area: task.area,
        shift: task.shift,
        status: task.status,
        assignedTo: [...task.assignedTo]
      })
    } else {
      setFormData(initialFormData)
    }
  }, [task, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar fecha
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      alert('No se pueden crear tareas para fechas pasadas')
      return
    }
    
    onSubmit(formData)
    onClose()
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="bg-white rounded-lg p-4 w-full sm:max-w-[500px] md:max-w-[600px]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-3 text-gray-900">
          {task ? 'Editar Tarea' : 'Nueva Tarea'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input input-bordered w-full h-9 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Área</label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="select select-bordered w-full h-9 text-sm"
                required
              >
                <option value="">Seleccionar área</option>
                {areas.map(area => (
                  <option key={area.id} value={area.name}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea textarea-bordered w-full text-sm"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input input-bordered w-full h-9 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Turno</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as 'A' | 'B' | 'C' })}
                className="select select-bordered w-full h-9 text-sm"
              >
                <option value="A">Turno A</option>
                <option value="B">Turno B</option>
                <option value="C">Turno C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Inicio</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input input-bordered w-full h-9 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora Fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input input-bordered w-full h-9 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Asignar a</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !formData.assignedTo.includes(e.target.value)) {
                  setFormData({
                    ...formData,
                    assignedTo: [...formData.assignedTo, e.target.value]
                  })
                }
              }}
              className="select select-bordered w-full h-9 text-sm"
            >
              <option value="">Seleccionar usuario</option>
              {users
                .filter(user => !formData.assignedTo.includes(user.name))
                .map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
            </select>

            <div className="mt-2 flex flex-wrap gap-1">
              {formData.assignedTo.map((userName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {userName}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        assignedTo: formData.assignedTo.filter((_, i) => i !== index)
                      })
                    }}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
