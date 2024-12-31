export const ORGANIZATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const

export type Organization = {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  tax_id?: string
  status: keyof typeof ORGANIZATION_STATUS
  created_at: string
  updated_at: string
} 