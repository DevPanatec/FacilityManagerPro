'use client'
import { useState, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'

interface CalendarProps {
  tasks: ScheduledTask[]
  onTaskClick: (task: ScheduledTask) => void
  onAddTask: (date: string) => void
  onDeleteTask: (id: string) => void
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

export default function Calendar({ tasks, onTaskClick, onAddTask, onDeleteTask }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: ScheduledTask[] } | null>(null);

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
    const days = []
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

  // Agrupar tareas por fecha
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: ScheduledTask[] } = {}
    tasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = []
      }
      grouped[task.date].push(task)
    })
    return grouped
  }, [tasks])

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
  }

  // Función para obtener las tareas de un día específico
  const getTasksForDate = (date: Date) => {
    const formattedDate = formatDate(date)
    return tasks.filter(task => task.date === formattedDate)
  }

  // Función para renderizar las tareas en una celda
  const renderCellTasks = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    if (dayTasks.length === 0) return null

    return (
        <div className="space-y-1">
            {dayTasks.map(task => (
                <div
                    key={task.id}
                    className={`
                        p-2 rounded-lg text-xs font-medium shadow-sm
                        transition-all duration-200 hover:shadow-md
                        ${task.status === 'completed'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : task.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }
                    `}
                >
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'cancelled' ? 'bg-red-500' :
                            'bg-blue-500'
                        }`} />
                        <span>{task.startTime}</span>
                    </div>
                    <p className="mt-1 truncate">{task.title}</p>
                </div>
            ))}
        </div>
    )
  }

  // Función para obtener los días de la semana actual
  const getWeekDays = () => {
    const days = []
    const firstDay = new Date(currentDate)
    firstDay.setDate(currentDate.getDate() - currentDate.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDay)
      day.setDate(firstDay.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Función para manejar el cambio de mes
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(event.target.value)
    setSelectedMonth(month)
    setCurrentDate(new Date(selectedYear, month))
  }

  // Función para manejar el cambio de año
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value)
    setSelectedYear(year)
    setCurrentDate(new Date(year, selectedMonth))
  }

  // Renderizar el contenido según la vista seleccionada
  const renderContent = () => {
    switch (view) {
      case 'week':
        return (
          <div className="grid grid-cols-7 flex-1">
            {getWeekDays().map((date, index) => (
              <div
                key={index}
                className={`border-r border-b p-2 ${
                  date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50' : ''
                }`}
                onClick={() => onAddTask(formatDate(date))}
              >
                <div className="font-medium text-sm mb-1">
                  {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                </div>
                {renderCellTasks(date)}
              </div>
            ))}
          </div>
        )

      case 'day':
        return (
          <div className="flex-1 p-4">
            <div className="space-y-2">
              {getTasksForDate(currentDate).map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border cursor-pointer ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' :
                    task.status === 'cancelled' ? 'bg-red-50 border-red-200' :
                    'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedTask(task)
                    setShowTaskDetails(true)
                  }}
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">
                    {task.startTime} - {task.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
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
                  <div className="flex items-center gap-3">
                    <select
                      value={currentDate.getMonth()}
                      onChange={handleMonthChange}
                      className="text-lg font-semibold text-gray-700 bg-transparent 
                               focus:outline-none cursor-pointer hover:text-blue-600 
                               transition-colors"
                    >
                      {/* ... meses ... */}
                    </select>
                    <select
                      value={currentDate.getFullYear()}
                      onChange={handleYearChange}
                      className="text-lg font-semibold text-gray-700 bg-transparent 
                               focus:outline-none cursor-pointer hover:text-blue-600 
                               transition-colors"
                    >
                      {/* ... años ... */}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => onAddTask(formatDate(new Date()))}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg 
                           hover:bg-blue-700 transition-all duration-200 flex items-center gap-2
                           shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Tarea
                </button>
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
                    ${!day.isCurrentMonth ? 'bg-white' : 'bg-white'}
                    ${day.isWeekend ? 'bg-white' : ''}
                    hover:bg-gray-50 transition-colors
                    ${formatDate(day.date) === formatDate(new Date()) ? 
                      'ring-1 ring-inset ring-blue-500' : ''}
                  `}
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
            <div className="flex items-center gap-3">
              <select
                value={currentDate.getMonth()}
                onChange={handleMonthChange}
                className="text-sm font-medium text-gray-700 px-2 py-1.5 
                         hover:text-blue-600 rounded-md transition-colors
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ].map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>

              <select
                value={currentDate.getFullYear()}
                onChange={handleYearChange}
                className="text-sm font-medium text-gray-700 px-2 py-1.5 
                         hover:text-blue-600 rounded-md transition-colors
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => 2024 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => onAddTask(formatDate(new Date()))}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50
                     rounded-md transition-all duration-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
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
              ${!day.isCurrentMonth ? 'bg-white' : 'bg-white'}
              ${day.isWeekend ? 'bg-white' : ''}
              hover:bg-gray-50 transition-colors
              ${formatDate(day.date) === formatDate(new Date()) ? 
                'ring-1 ring-inset ring-blue-500' : ''}
            `}
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

      {selectedDayTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Tareas del {selectedDayTasks.date.toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDayTasks(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedDayTasks.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      task.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : task.status === 'cancelled'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {task.startTime} - {task.endTime}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.assignedTo.map((person, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {person}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status === 'completed' ? 'Completado' : 
                           task.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            onTaskClick(task);
                            setSelectedDayTasks(null);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 
                                   transition-colors duration-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            onDeleteTask(task.id);
                            setSelectedDayTasks(null);
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 
                                   transition-colors duration-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
