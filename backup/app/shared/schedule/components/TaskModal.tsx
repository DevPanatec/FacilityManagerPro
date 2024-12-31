'use client'
import { useState, useEffect } from 'react'
import { ScheduledTask, ShiftType, TaskStatus } from '../../../../lib/types/schedule'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<ScheduledTask, 'id'>) => void
  task?: ScheduledTask
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const initialFormData: Omit<ScheduledTask, 'id'> = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
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
        assignedTo: task.assignedTo
      })
    } else {
      setFormData(initialFormData)
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
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
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Área</label>
              <input
                type="text"
                value={formData.area}
                onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                className="w-full border rounded p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hora Inicio</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hora Fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full border rounded p-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Turno</label>
              <select
                value={formData.shift}
                onChange={e => setFormData(prev => ({ ...prev, shift: e.target.value as ShiftType }))}
                className="w-full border rounded p-2"
                required
              >
                <option value="A">Turno A</option>
                <option value="B">Turno B</option>
                <option value="C">Turno C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
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

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {task ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
