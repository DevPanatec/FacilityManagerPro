export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done'
} as const

export const TASK_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]
export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY]

export interface Task {
  id: string
  organization_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category_id?: string
  assigned_to?: string
  due_date?: string
  created_by: string
  created_at: string
  updated_at: string
} 
