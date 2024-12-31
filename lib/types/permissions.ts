// Recursos del sistema
export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  DEPARTMENTS: 'departments',
  TASKS: 'tasks',
  ASSIGNMENTS: 'assignments',
  INVENTORY: 'inventory',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
  WEBHOOKS: 'webhooks',
  AUDIT_LOGS: 'audit_logs'
} as const

// Acciones permitidas
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage'
} as const

export type Resource = typeof RESOURCES[keyof typeof RESOURCES]
export type Action = typeof ACTIONS[keyof typeof ACTIONS]

export interface Permission {
  resource: Resource;
  action: Action;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
} 