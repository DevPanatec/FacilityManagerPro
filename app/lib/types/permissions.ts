export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  DEPARTMENTS: 'departments',
  EMPLOYEES: 'employees',
  REPORTS: 'reports',
  ATTENDANCE: 'attendance',
  TIME_OFF: 'time_off'
} as const

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export'
} as const

export type Resource = keyof typeof RESOURCES
export type Action = keyof typeof ACTIONS

export interface Permission {
  id: string
  role_id: string
  resource: Resource
  action: Action
  conditions?: Record<string, any>
  created_at: string
}

export interface Role {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
} 