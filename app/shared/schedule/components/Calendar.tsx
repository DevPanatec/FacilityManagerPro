'use client'
import { useState, useMemo } from 'react'
import { Database } from '@/lib/types/database'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog } from '@headlessui/react'

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
  const [isCreatingTask, setIsCreatingTask] = useState(false)

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

  const handleDayClick = (date: Date) => {
    const dayTasks = getTasksForDate(date)
    setSelectedDayTasks({ date, tasks: dayTasks })
    setShowTaskDetails(true)
    setIsCreatingTask(false)
  }

  const handleAddTask = (date: Date) => {
    setSelectedDayTasks({ date, tasks: getTasksForDate(date) })
    setShowTaskDetails(true)
    setIsCreatingTask(true)
    // Esto llama al onAddTask con el formato de fecha adecuado
    // pero no abrirá otro modal, solo preparará el estado
  }

  const DayTasksModal = () => (
    <AnimatePresence>
      {showTaskDetails && (
        <Dialog
          open={showTaskDetails}
          onClose={() => setShowTaskDetails(false)}
          className="relative z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <Dialog.Panel className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    {isCreatingTask ? 
                      `Nueva tarea para ${selectedDayTasks?.date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric',
                        month: 'long', 
                        year: 'numeric'
                      })}` : 
                      `Tareas para ${selectedDayTasks?.date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric',
                        month: 'long', 
                        year: 'numeric'
                      })}`
                    }
                  </Dialog.Title>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isCreatingTask ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        // Regresar a la vista de tareas si hay tareas, o cerrar si no hay
                        if (selectedDayTasks?.tasks.length === 0) {
                          setShowTaskDetails(false);
                        } else {
                          setIsCreatingTask(false);
                        }
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      {selectedDayTasks?.tasks.length === 0 ? 'Cancelar' : 'Ver tareas de este día'}
                    </button>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          // Llamar a onAddTask con la fecha formateada
                          onAddTask(formatDate(selectedDayTasks?.date || new Date()));
                          // Cerrar el modal después de iniciar la creación
                          setShowTaskDetails(false);
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                                  flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Crear nueva tarea
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-2">
                        {selectedDayTasks?.tasks && selectedDayTasks.tasks.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-2 text-sm"
                          >
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                              {selectedDayTasks.tasks.length} {selectedDayTasks.tasks.length === 1 ? 'tarea' : 'tareas'}
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <button
                        onClick={() => setIsCreatingTask(true)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir tarea
                      </button>
                    </div>

                    {selectedDayTasks?.tasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-center py-8"
                      >
                        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-gray-500">No hay tareas programadas para este día</p>
                        <button
                          onClick={() => setIsCreatingTask(true)}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Crear una tarea
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {selectedDayTasks?.tasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-lg">{task.title}</h3>
                                {task.description && (
                                  <p className="text-gray-600 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  {task.start_time && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {task.start_time}
                                    </span>
                                  )}
                                  {task.assignee && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {task.assignee.first_name} {task.assignee.last_name}
                                    </span>
                                  )}
                                  {task.priority && (
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {task.priority === 'high' ? 'Alta' :
                                       task.priority === 'medium' ? 'Media' : 'Baja'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {task.status === 'completed' ? 'Completada' :
                                   task.status === 'cancelled' ? 'Cancelada' :
                                   task.status === 'in_progress' ? 'En Progreso' :
                                   'Pendiente'}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => onTaskClick(task)}
                                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-full transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                                        onDeleteTask(task.id);
                                        // Actualizar la lista después de eliminar
                                        if (selectedDayTasks) {
                                          setSelectedDayTasks({
                                            ...selectedDayTasks,
                                            tasks: selectedDayTasks.tasks.filter(t => t.id !== task.id)
                                          });
                                        }
                                      }
                                    }}
                                    className="p-2 hover:bg-red-100 text-red-600 rounded-full transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del calendario */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setCurrentDate(new Date())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Hoy
            </motion.button>
            <motion.h2 
              className="text-lg font-semibold"
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: -10 }}
              key={currentDate.getMonth() + "" + currentDate.getFullYear()}
            >
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </motion.h2>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => handleAddTask(new Date())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                       rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 transition-all duration-200 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Tarea
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <motion.button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
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
      <div className="grid grid-cols-7 flex-1">
        {daysInMonth.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`
              min-h-[100px] p-2 border-b border-r bg-white
              ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
              ${day.isWeekend ? 'bg-gray-50' : ''}
              hover:bg-gray-50 transition-all duration-200
              ${formatDate(day.date, 'compare') === formatDate(new Date(), 'compare') ? 
                'ring-1 ring-inset ring-blue-500' : ''}
            `}
            onClick={() => handleDayClick(day.date)}
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
          </motion.div>
        ))}
      </div>

      <DayTasksModal />
    </div>
  )
}
