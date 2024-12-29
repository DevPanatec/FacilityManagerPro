export const NOTIFICATION_TYPES = {
  // Reportes
  REPORT_GENERATED: 'report_generated',
  REPORT_SHARED: 'report_shared',
  
  // Tareas
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENT: 'task_comment',
  TASK_DUE_SOON: 'task_due_soon',
  
  // Evaluaciones
  EVALUATION_ASSIGNED: 'evaluation_assigned',
  EVALUATION_COMPLETED: 'evaluation_completed',
  EVALUATION_REVIEWED: 'evaluation_reviewed',
  
  // KPIs
  KPI_ALERT: 'kpi_alert',
  METRIC_THRESHOLD: 'metric_threshold',
  
  // Documentos
  DOCUMENT_SHARED: 'document_shared',
  DOCUMENT_UPDATED: 'document_updated',
  
  // Errores
  ERROR_ALERT: 'error_alert',
  SYSTEM_ALERT: 'system_alert',
  
  // Otros
  GENERAL: 'general'
} as const

export interface NotificationData {
  // Datos específicos por tipo
  report?: {
    report_id: string
    report_type: string
  }
  task?: {
    task_id: string
    task_title: string
    due_date?: string
  }
  evaluation?: {
    evaluation_id: string
    employee_id: string
  }
  document?: {
    document_id: string
    document_name: string
  }
  error?: {
    error_id: string
    error_type: string
    severity: string
  }
  [key: string]: any
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: keyof typeof NOTIFICATION_TYPES
  title: string
  message: string
  data?: NotificationData
  related_resource_type?: string
  related_resource_id?: string
  read: boolean
  created_at: string
} 