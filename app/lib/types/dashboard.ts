export interface Widget {
  id: string
  user_id?: string
  widget_type: string
  title: string
  config?: any
  position: {
    h: number
    w: number
    x: number
    y: number
  }
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface LayoutItem {
  i: string // widget id
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardLayout {
  id: string
  user_id?: string
  name: string
  layout: LayoutItem[]
  is_default?: boolean
  created_at?: string
  updated_at?: string
} 