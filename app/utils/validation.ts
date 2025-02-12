import { z } from 'zod'
import type { Database } from '@/lib/types/database'

type User = {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
  status: 'active' | 'inactive' | 'pending'
  first_name?: string
  last_name?: string
  organization_id?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

type Task = {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  created_by: string
  organization_id: string
  area_id?: string
  due_date?: string
  created_at?: string
  updated_at?: string
}

type Organization = {
  id: string
  name: string
  description?: string
  logo_url?: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

type Area = {
  id: string
  name: string
  description?: string
  organization_id: string
  parent_id?: string
  status: 'active' | 'inactive'
  sala_id?: string
  created_at?: string
  updated_at?: string
}

type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: 'task' | 'work_shift' | 'inventory' | 'system'
  priority: 'low' | 'medium' | 'high'
  read: boolean
  action_url?: string
  created_at: string
  updated_at: string
}

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

export const validateUser = (data: any): string[] => {
  const requiredFields = ['email', 'role', 'status']
  const errors: string[] = []

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`El campo ${field} es requerido`)
    }
  })

  if (data.email && !isValidEmail(data.email)) {
    errors.push('El email no es válido')
  }

  return errors
}

export const validateOrganization = (data: any): string[] => {
  const requiredFields = ['name', 'status']
  const errors: string[] = []

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`El campo ${field} es requerido`)
    }
  })

  return errors
}

export const validateTask = (data: any): string[] => {
  const requiredFields = ['title', 'status', 'priority', 'created_by']
  const errors: string[] = []

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`El campo ${field} es requerido`)
    }
  })

  return errors
}

export const validateNotification = (data: any): string[] => {
  const requiredFields = ['title', 'message', 'type', 'user_id', 'priority']
  const errors: string[] = []

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`El campo ${field} es requerido`)
    }
  })

  return errors
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 