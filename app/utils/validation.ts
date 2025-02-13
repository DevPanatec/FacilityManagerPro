import { z } from 'zod'
import type { Database } from '@/lib/types/database'

type User = Database['public']['Tables']['users']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type Area = Database['public']['Tables']['areas']['Row']

// Esquemas de validación
const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(2).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  organization_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional()
})

const organizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional()
})

const taskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  status: z.string(),
  priority: z.string(),
  assigned_to: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid(),
  organization_id: z.string().uuid(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional()
})

const notificationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  message: z.string(),
  type: z.string(),
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  read: z.boolean().default(false),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional()
})

const areaSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  status: z.string(),
  sala_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional()
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