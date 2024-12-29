export type RecurrencePattern = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number // cada X días/semanas/meses/años
  daysOfWeek?: number[] // 0-6 (domingo-sábado)
  daysOfMonth?: number[] // 1-31
  monthsOfYear?: number[] // 1-12
  endDate?: string
  maxOccurrences?: number
  skipHolidays?: boolean
  skipWeekends?: boolean
}

export type Task = {
  id: string
  title: string
  description?: string
  organization_id: string
  assigned_to?: string
  due_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  recurrence?: RecurrencePattern
  parent_task_id?: string // Para tareas recurrentes generadas
  created_by: string
  created_at: string
  updated_at: string
} 