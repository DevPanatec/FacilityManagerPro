export interface WidgetConfig {
  dataSource?: string
  refreshInterval?: number
  displayType?: 'chart' | 'table' | 'metric' | 'list'
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut'
  filters?: {
    [key: string]: string | number | boolean | null
  }
  metrics?: string[]
  dimensions?: string[]
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DashboardWidget {
  id: string
  type: string
  title: string
  config: WidgetConfig
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardLayout {
  id: string
  name: string
  description?: string
  user_id: string
  is_default: boolean
  widgets: DashboardWidget[]
  created_at: string
  updated_at: string
}

export interface DashboardData {
  layouts: DashboardLayout[]
  widgets: DashboardWidget[]
} 
