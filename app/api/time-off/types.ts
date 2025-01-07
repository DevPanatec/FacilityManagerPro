export const TIME_OFF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const

export const TIME_OFF_TYPE = {
  VACATION: 'vacation',
  SICK: 'sick',
  PERSONAL: 'personal',
  OTHER: 'other'
} as const

export type TimeOffRequest = {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  request_type: keyof typeof TIME_OFF_TYPE
  status: keyof typeof TIME_OFF_STATUS
  notes?: string
  created_at: string
  updated_at: string
} 
