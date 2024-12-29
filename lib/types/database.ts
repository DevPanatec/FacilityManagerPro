// Tipos base que pueden ser reutilizados
type BaseEntity = {
  id: number
  created_at: string
  updated_at?: string
}

export type ActivityLog = BaseEntity & {
  action: string
  description: string
  user_id: string
}

export type AnalyticsData = BaseEntity & {
  metric_name: string
  value: number
  date: string
}

export type Area = BaseEntity & {
  name: string
  description?: string
}

// ... y así sucesivamente para cada tabla

export type Department = BaseEntity & {
  name: string
  description?: string
  manager_id?: string
}

export type Document = BaseEntity & {
  title: string
  content: string
  status: string
  owner_id: string
}

// ... continúa con el resto de las tablas 