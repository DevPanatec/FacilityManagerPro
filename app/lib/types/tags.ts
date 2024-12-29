export interface Tag {
  id: string
  name: string
  color: string
  organization_id: string
  created_by?: string
  created_at?: string
  updated_at?: string
  entity_tags?: {
    count: number
  }
} 