import { z } from 'zod'
import type { Database } from '@/lib/types/database'

type User = Database['public']['Tables']['users']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type Area = Database['public']['Tables']['areas']['Row']

// Esquemas de validación
const userSchema = z.object({
  email: z.string().email(),
  role: z.enum(['superadmin', 'admin', 'enterprise', 'usuario']),
  first_name: z.string().min(2).nullable(),
  last_name: z.string().min(2).nullable(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  organization_id: z.string().uuid().nullable(),
  avatar_url: z.string().url().nullable().optional()
})

const organizationSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  area_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  due_date: z.string().datetime().nullable().optional(),
  created_by: z.string().uuid()
})

const notificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(3),
  message: z.string(),
  type: z.enum(['task', 'work_shift', 'inventory', 'system']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  read: z.boolean().default(false),
  action_url: z.string().url().nullable().optional()
})

const areaSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable().optional(),
  organization_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

// Validador centralizado
export const validator = {
  validateUser(data: unknown): User {
    return userSchema.parse(data) as User
  },

  validateOrganization(data: unknown): Organization {
    return organizationSchema.parse(data) as Organization
  },

  validateTask(data: unknown): Task {
    return taskSchema.parse(data) as Task
  },

  validateNotification(data: unknown): Notification {
    return notificationSchema.parse(data) as Notification
  },

  validateArea(data: unknown): Area {
    return areaSchema.parse(data) as Area
  },

  // Función helper para validar fechas
  validateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid dates')
    }
    
    if (start > end) {
      throw new Error('Start date must be before end date')
    }
    
    return { start, end }
  },

  // Función helper para validar IDs
  validateId(id: string) {
    if (!id || typeof id !== 'string' || id.length < 1) {
      throw new Error('Invalid ID')
    }
    return id
  }
} 