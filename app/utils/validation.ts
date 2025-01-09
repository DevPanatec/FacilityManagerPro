import { z } from 'zod'
import type { Database } from '@/types/supabase'

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
  logo_url: z.string().url().nullable().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active')
})

const taskSchema = z.object({
  organization_id: z.string().uuid(),
  area_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  created_by: z.string().uuid().nullable()
})

const notificationSchema = z.object({
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(3),
  message: z.string(),
  type: z.string(),
  read: z.boolean().default(false)
})

const areaSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(3),
  description: z.string().nullable().optional(),
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