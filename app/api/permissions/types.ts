export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  DEPARTMENTS: 'departments',
  POSITIONS: 'positions',
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  TIME_OFF: 'time_off',
  WORK_SHIFTS: 'work_shifts',
  DOCUMENTS: 'documents',
  REPORTS: 'reports'
} as const

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  MANAGE: 'manage'
} as const

export type Permission = {
  id: string
  role_id: string
  resource: keyof typeof RESOURCES
  action: keyof typeof ACTIONS
  created_at: string
}
