'use client';

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Shift {
  id: string
  name: string
  timeRange: string
  assignedUsers: number
  onlineUsers: number
}

interface Task {
  id: string
  title: string
  assignedTo: string
  startTime: string
  endTime: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface Area {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export default function AssignmentsPage() {
  // Estado para modales
  const [showShiftModal, setShowShiftModal] = useState(false)
  
  // Estado para el formulario de nueva asignación
  const [formData, setFormData] = useState({
    user: '',
    area: '',
    date: '',
    frequency: 'daily' // 'daily' | 'weekly' | 'biweekly' | 'monthly'
  })

  // Estado para los turnos
  const [shifts] = useState<Shift[]>([
    {
      id: 'A',
      name: 'Turno A',
      timeRange: '08:00 AM - 04:00 PM',
      assignedUsers: 2,
      onlineUsers: 1
    },
    {
      id: 'B',
      name: 'Turno B',
      timeRange: '04:00 PM - 12:00 AM',
      assignedUsers: 2,
      onlineUsers: 2
    },
    {
      id: 'C',
      name: 'Turno C',
      timeRange: '12:00 AM - 08:00 AM',
      assignedUsers: 1,
      onlineUsers: 0
    }
  ])

  // Estado para las áreas y tareas
  const [areas] = useState<Area[]>([
    {
      id: '1',
      name: 'Bioseguridad',
      color: '#FF6B6B',
      tasks: [
        {
          id: '1',
          title: 'Desinfección de trajes y EPP',
          assignedTo: 'Juan Pérez',
          startTime: '28/11/2024 08:15',
          endTime: '28/11/2024 09:30',
          status: 'completed'
        },
        {
          id: '2',
          title: 'Limpieza de duchas de descontaminación',
          assignedTo: 'Ana Martínez',
          startTime: '29/11/2024 10:00',
          endTime: '',
          status: 'in_progress'
        }
      ]
    },
    {
      id: '2',
      name: 'Inyección',
      color: '#4ECDC4',
      tasks: [
        {
          id: '3',
          title: 'Limpieza de máquinas inyectoras',
          assignedTo: 'María López',
          startTime: '28/11/2024 07:00',
          endTime: '28/11/2024 08:45',
          status: 'completed'
        }
      ]
    },
    {
      id: '3',
      name: 'Cuarto Frío',
      color: '#45B7D1',
      tasks: [
        {
          id: '4',
          title: 'Limpieza de estanterías refrigeradas',
          assignedTo: 'Isabel Díaz',
          startTime: '29/11/2024 08:00',
          endTime: '',
          status: 'in_progress'
        }
      ]
    }
  ])

  // Manejadores de eventos
  const handleAddUserToShift = () => {
    setShowShiftModal(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFrequencyChange = (frequency: string) => {
    setFormData(prev => ({
      ...prev,
      frequency
    }))
  }

  const handleAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    // Validar que todos los campos estén llenos
    if (!formData.user || !formData.area || !formData.date) {
      alert('Por favor complete todos los campos')
      return
    }
    
    // Aquí iría la lógica para crear la asignación
    console.log('Nueva asignación:', formData)
  }

  const handleDeleteTask = (areaId: string, taskId: string) => {
    // Aquí iría la lógica para eliminar la tarea
    console.log('Eliminar tarea:', { areaId, taskId })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#4263eb] text-white p-6">
        <h1 className="text-2xl font-bold">Gestión de Asignaciones</h1>
        <p className="text-blue-100">Administra los turnos y tareas del personal</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna de Turnos */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Turnos del Personal</h2>
            
            {shifts.map(shift => (
              <div 
                key={shift.id}
                className={`
                  p-4 rounded-lg bg-white shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow
                  ${shift.id === 'A' ? 'border-blue-500' :
                    shift.id === 'B' ? 'border-green-500' :
                    'border-purple-500'}
                `}
                onClick={() => setShowShiftModal(true)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{shift.name}</h3>
                    <p className="text-sm text-gray-500">{shift.assignedUsers} personas asignadas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{shift.timeRange}</p>
                    <p className="text-sm text-gray-500">{shift.onlineUsers} en línea</p>
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddUserToShift}
              className="w-full py-2 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
            >
              Agregar Usuario a Turno
            </button>
          </div>

          {/* Columna de Nueva Asignación */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Nueva Asignación</h2>
            
            <form onSubmit={handleAssignment} className="space-y-6">
              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select 
                  name="user"
                  value={formData.user}
                  onChange={handleFormChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  <option value="maria">María López</option>
                  <option value="juan">Juan Pérez</option>
                  <option value="ana">Ana Martínez</option>
                </select>
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <select 
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar área</option>
                  <option value="bioseguridad">Bioseguridad</option>
                  <option value="inyeccion">Inyección</option>
                  <option value="cuarto-frio">Cuarto Frío</option>
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Asignación
                </label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Periodicidad */}
              <div className="grid grid-cols-4 gap-2">
                <button 
                  type="button" 
                  onClick={() => handleFrequencyChange('daily')}
                  className={`py-2 px-4 rounded-lg transition-colors ${
                    formData.frequency === 'daily' 
                      ? 'bg-[#4263eb] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Diario
                </button>
                <button 
                  type="button"
                  onClick={() => handleFrequencyChange('weekly')}
                  className={`py-2 px-4 rounded-lg transition-colors ${
                    formData.frequency === 'weekly'
                      ? 'bg-[#4263eb] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semanal
                </button>
                <button 
                  type="button"
                  onClick={() => handleFrequencyChange('biweekly')}
                  className={`py-2 px-4 rounded-lg transition-colors ${
                    formData.frequency === 'biweekly'
                      ? 'bg-[#4263eb] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Quincenal
                </button>
                <button 
                  type="button"
                  onClick={() => handleFrequencyChange('monthly')}
                  className={`py-2 px-4 rounded-lg transition-colors ${
                    formData.frequency === 'monthly'
                      ? 'bg-[#4263eb] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mensual
                </button>
              </div>

              <button 
                type="submit"
                className={`w-full py-2 rounded-lg transition-colors ${
                  formData.user && formData.area && formData.date
                    ? 'bg-[#4263eb] text-white hover:bg-[#364fc7]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!formData.user || !formData.area || !formData.date}
              >
                Asignar
              </button>
            </form>
          </div>
        </div>

        {/* Sección de Tareas por Área */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tareas por Área</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areas.map(area => (
              <div 
                key={area.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
                style={{ borderLeft: `4px solid ${area.color}` }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">{area.name}</h3>
                    <span className="text-sm text-gray-500">{area.tasks.length} tareas</span>
                  </div>

                  <div className="space-y-4">
                    {area.tasks.map(task => (
                      <div key={task.id} className="relative">
                        <button 
                          onClick={() => handleDeleteTask(area.id, task.id)}
                          className="absolute top-0 right-0 text-gray-400 hover:text-gray-500"
                        >
                          ×
                        </button>
                        
                        <h4 className="font-medium text-gray-900 pr-6">{task.title}</h4>
                        <p className="text-sm text-gray-500">Asignado a: {task.assignedTo}</p>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>Inicio:</span>
                            <span>{task.startTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Finalización:</span>
                            <span>{task.endTime || 'En progreso'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progreso</span>
                      <span>
                        {area.tasks.filter(t => t.status === 'completed').length}/
                        {area.tasks.length}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ 
                          width: `${(area.tasks.filter(t => t.status === 'completed').length / area.tasks.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para agregar usuario a turno */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Agregar Usuario a Turno</h3>
            {/* Aquí irá el contenido del modal */}
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7]">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 