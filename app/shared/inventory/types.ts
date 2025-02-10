export interface InventoryItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  min_stock: number
  status: string
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

export interface InventoryFormData {
  name: string
  description?: string
  quantity: number
  unit: string
  min_stock: number
  organization_id?: string
}

export interface InventoryUsage {
  id: string
  inventory_id: string
  quantity: number
  date: string
  user_id: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface InventoryRestock {
  id: string
  inventory_id: string
  quantity: number
  date: string
  supplier: string
  created_at: string
  updated_at: string
} 