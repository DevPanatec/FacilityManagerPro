export interface InventoryItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  quantity: number
  minimum_quantity: number
  unit_of_measure: string
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
  minimum_quantity: number
  unit_of_measure: string
  organization_id?: string
} 