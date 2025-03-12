'use client'
import { useState, useMemo } from 'react'
import { Database } from '@/lib/types/database'

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

interface CalendarProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (date: string) => void
  onDeleteTask: (id: string) => void
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isWeekend: boolean
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-200',
  in_progress: 'bg-blue-100 border-blue-200',
  completed: 'bg-green-100 border-green-200',
  cancelled: 'bg-red-100 border-red-200'
}

export default function Calendar({ tasks, onTaskClick, onAddTask, onDeleteTask }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: Task[] } | null>(null)

  // Obtener el primer día del mes actual
  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    return date
  }, [currentDate])

  // Obtener el último día del mes actual
  const lastDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  }, [currentDate])

  // Crear array de días del mes con corrección de alineación
  const daysInMonth = useMemo(() => {
    const days: CalendarDay[] = []
    const startDay = firstDayOfMonth.getDay()
    
    // Agregar días del mes anterior para completar la primera semana
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
    
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i)
      days.push({
        date,
        isCurrentMonth: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      days.push({
        date,
        isCurrentMonth: true,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    // Agregar días del mes siguiente
    const remainingDays = 42 - days.length // 6 semanas completas
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    return days
  }, [currentDate, firstDayOfMonth, lastDayOfMonth])

  const formatDate = (date: Date, format: string = '') => {
    // Formato para comparaciones de fecha (YYYY-MM-DD)
    if (format === 'compare') {
      // Uso de técnica de fecha local para evitar problemas de zona horaria
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Formato para datetime-local (YYYY-MM-DDTHH:mm)
    // Usar método manual para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Para la hora, usamos la hora local actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Función para obtener las tareas de un día específico
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const dueDate = task.due_date
      if (!dueDate) return false
      const taskDate = new Date(dueDate)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Función para renderizar las tareas en una celda
  const renderCellTasks = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    if (dayTasks.length === 0) return null

    return (
      <div className="space-y-1">
        {dayTasks.map(task => {
          const dueDate = task.due_date ? new Date(task.due_date) : null
          const timeString = dueDate ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

          return (
            <div
              key={task.id}
              className={`
                p-2 rounded-lg text-xs font-medium shadow-sm
                transition-all duration-200 hover:shadow-md
                ${task.status === 'completed'
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : task.status === 'cancelled'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : task.priority === 'high'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : task.priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }
              `}
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'cancelled' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <span>{timeString}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="truncate flex-1">{task.title}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                      onDeleteTask(task.id);
                    }
                  }}
                  className="ml-2 p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTask = (task: Task) => {
    return (
      <div
        key={task.id}
        className={`p-2 mb-1 rounded-lg border cursor-pointer ${STATUS_COLORS[task.status as string] || 'bg-gray-100 border-gray-200'}`}
        onClick={() => onTaskClick(task)}
      >
        <div className="font-medium text-sm truncate">{task.title}</div>
        {task.organization && (
          <div className="text-xs text-gray-500 truncate">
            {task.organization.name}
          </div>
        )}
        {task.assignee && (
          <div className="text-xs text-gray-500 truncate">
            Asignado a: {task.assignee.first_name} {task.assignee.last_name}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del calendario */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Hoy
            </button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onAddTask(formatDate(new Date()))}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                       rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 transition-all duration-200 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Tarea
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
          <div 
            key={day} 
            className={`py-3 text-sm font-medium text-center
              ${i === 0 || i === 6 ? 'text-blue-600' : 'text-gray-600'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="flex-1 grid grid-cols-7">
        {daysInMonth.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[100px] p-2 border-b border-r bg-white
              ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
              ${day.isWeekend ? 'bg-gray-50' : ''}
              hover:bg-gray-50 transition-colors
              ${formatDate(day.date, 'compare') === formatDate(new Date(), 'compare') ? 
                'ring-1 ring-inset ring-blue-500' : ''}
            `}
            onClick={() => onAddTask(formatDate(day.date))}
          >
            <span className={`text-sm font-medium
              ${!day.isCurrentMonth ? 'text-gray-400' : 
                day.isWeekend ? 'text-gray-600' : 'text-gray-900'}
            `}>
              {day.date.getDate()}
            </span>
            <div className="mt-1 space-y-1">
              {renderCellTasks(day.date)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
