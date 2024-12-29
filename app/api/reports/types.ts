export type ReportType = {
  id: string
  title: string
  description?: string
  data: any
  created_by: string
  created_at: string
  updated_at: string
}

export type AttendanceReportParams = {
  start_date: string
  end_date: string
  department_id?: string
  employee_id?: string
}

export type TimeOffReportParams = {
  start_date: string
  end_date: string
  department_id?: string
  status?: string
  request_type?: string
}

export type ExportFormat = 'csv' | 'pdf' | 'excel'

export type NotificationType = 'email' | 'push' | 'in-app'

export type NotificationPreference = {
  user_id: string
  type: NotificationType
  enabled: boolean
  channels: {
    email?: boolean
    push?: boolean
    in_app?: boolean
  }
}

export type ExportOptions = {
  format: ExportFormat
  filters?: Record<string, any>
  columns?: string[]
} 