'use client'
import { useState, useEffect } from 'react'
import Calendar from './components/Calendar'
import TaskModal from './components/TaskModal'

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

const MOCK_TASKS: ScheduledTask[] = [
  {
    id: '1',
    title: 'Limpieza profunda de equipos',
    description: 'Se realizará una limpieza profunda incluyendo equipos y superficies',
    date: '2024-05-15',
    startTime: '10:00',
    endTime: '11:00',
    area: 'Producción',
    shift: 'A',
    status: 'pending',
    assignedTo: ['Juan Pérez', 'María García']
  }
]

export default function SchedulePage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Mock users - Esto después vendrá de tu base de datos
  const MOCK_USERS = [
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María García' },
    { id: '3', name: 'Carlos López' }
  ]

  // Mock areas - Actualizado con las nuevas áreas industriales
  const MOCK_AREAS = [
    { id: '1', name: 'Bioseguridad' },
    { id: '2', name: 'Inyección' },
    { id: '3', name: 'Cuarto Frío' },
    { id: '4', name: 'Producción' },
    { id: '5', name: 'Techos, Paredes y Pisos' },
    { id: '6', name: 'Canaletas y Rejillas' },
    { id: '7', name: 'Área Externa' }
  ]

  useEffect(() => {
    const savedTasks = localStorage.getItem('scheduledTasks')
    setTasks(savedTasks ? JSON.parse(savedTasks) : MOCK_TASKS)
  }, [])

  useEffect(() => {
    localStorage.setItem('scheduledTasks', JSON.stringify(tasks))
  }, [tasks])

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 w-[90vw] max-w-[1200px] mx-auto px-1 py-1">
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg 
                className="w-6 h-6 text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-600">Calendario de Tareas</h1>
              <p className="text-sm text-gray-500">Gestión y programación de actividades</p>
            </div>
          </div>
        </div>

        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-blue-500">
          <Calendar 
            tasks={tasks} 
            onTaskClick={handleTaskClick}
            onAddTask={(date) => {
              setSelectedDate(date)
              setSelectedTask(null)
              setIsModalOpen(true)
            }}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
        initialDate={selectedDate}
        users={MOCK_USERS.map(user => ({
          ...user,
          icon: (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">{user.name[0]}</span>
            </div>
          )
        }))}
        areas={MOCK_AREAS.map(area => ({
          ...area,
          icon: getAreaIcon(area.name)
        }))}
        onSubmit={(taskData) => {
          if (selectedTask) {
            setTasks(tasks.map(task => 
              task.id === selectedTask.id ? { ...taskData, id: task.id } : task
            ))
          } else {
            setTasks([...tasks, { ...taskData, id: Date.now().toString() }])
          }
          handleCloseModal()
        }}
      />
    </div>
  )
}

function getAreaIcon(areaName) {
  const icons = {
    'Bioseguridad': (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'Inyección': (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    'Cuarto Frío': (
      <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'Producción': (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    'Techos, Paredes y Pisos': (
      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'Canaletas y Rejillas': (
      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    'Área Externa': (
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  };

  return icons[areaName] || (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
