'use client'

import { useState } from 'react'
import Calendar from './components/Calendar'
import { TaskModal } from './components/TaskModal'
import { ScheduledTask } from '../../../lib/types/schedule'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | undefined>()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowTaskModal(true)
  }

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleSaveTask = (task: Omit<ScheduledTask, 'id'>) => {
    if (selectedTask) {
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id 
          ? { ...t, ...task }
          : t
      ))
    } else {
      const newTask: ScheduledTask = {
        ...task,
        id: Math.random().toString(36).substr(2, 9)
      }
      setTasks(prev => [...prev, newTask])
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendario</h1>
      
      <Calendar
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onAddTask={(date) => {
          setSelectedDate(new Date(date));
          setShowTaskModal(true);
        }}
        onDeleteTask={(id) => {
          setTasks(prev => prev.filter(task => task.id !== id));
        }}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedTask(undefined)
        }}
        onSave={handleSaveTask}
        task={selectedTask}
      />
    </div>
  )
}
