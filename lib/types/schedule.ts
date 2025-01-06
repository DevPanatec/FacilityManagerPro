export type ShiftType = 'A' | 'B' | 'C'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface ScheduledTask {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  area: string
  shift: ShiftType
  status: TaskStatus
  assignedTo: string[]
  created_at?: string
  updated_at?: string
}

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  type: 'task' | 'shift' | 'meeting'
  status: TaskStatus
  participants: string[]
  location?: string
  created_at: string
  updated_at: string
}

export interface ShiftAssignment {
  id: string
  employee_id: string
  shift_type: ShiftType
  date: string
  area: string
  status: 'scheduled' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
} 