import { z } from 'zod'
import type { Database } from '@/types/supabase'

type User = Database['public']['Tables']['users']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type Evaluation = Database['public']['Tables']['evaluations']['Row']
type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row']
type SecurityAuditLog = Database['public']['Tables']['security_audit_logs']['Row']
type FailedAuthAttempt = Database['public']['Tables']['failed_auth_attempts']['Row']
type SecuritySettings = Database['public']['Tables']['security_settings']['Row']
type Area = Database['public']['Tables']['areas']['Row']
type Incident = Database['public']['Tables']['incidents']['Row']
type DocumentationCategory = Database['public']['Tables']['documentation_categories']['Row']
type DocumentationArticle = Database['public']['Tables']['documentation_articles']['Row']

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

const evaluationSchema = z.object({
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  evaluator_id: z.string().uuid(),
  type: z.enum(['performance', 'skills', 'objectives']),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).default('draft'),
  scores: z.record(z.any()),
  comments: z.string().nullable().optional()
})

const notificationSchema = z.object({
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(3),
  message: z.string(),
  type: z.string(),
  read: z.boolean().default(false)
})

const notificationPreferenceSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string(),
  enabled: z.boolean().default(true)
})

const securityAuditLogSchema = z.object({
  organization_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  event_type: z.string(),
  resource_type: z.string(),
  resource_id: z.string().uuid().nullable(),
  old_values: z.record(z.any()).nullable(),
  new_values: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable()
})

const failedAuthAttemptSchema = z.object({
  organization_id: z.string().uuid(),
  email: z.string().email(),
  ip_address: z.string(),
  user_agent: z.string().nullable(),
  attempt_count: z.number().int().min(1),
  blocked_until: z.string().datetime().nullable()
})

const securitySettingsSchema = z.object({
  organization_id: z.string().uuid(),
  password_min_length: z.number().int().min(8).default(8),
  password_require_uppercase: z.boolean().default(true),
  password_require_lowercase: z.boolean().default(true),
  password_require_numbers: z.boolean().default(true),
  password_require_special_chars: z.boolean().default(true),
  password_expiry_days: z.number().int().min(1).default(90),
  max_failed_attempts: z.number().int().min(1).default(5),
  lockout_duration_minutes: z.number().int().min(1).default(30),
  session_timeout_minutes: z.number().int().min(1).default(60),
  mfa_required: z.boolean().default(false),
  allowed_ip_ranges: z.array(z.string()).default([])
})

const areaSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(3),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

const incidentSchema = z.object({
  organization_id: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  type: z.enum(['security', 'maintenance', 'health_safety', 'environmental', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  area_id: z.string().uuid().nullable().optional(),
  reported_by: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  resolution_date: z.string().datetime().nullable().optional()
})

const documentationCategorySchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(3),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order_index: z.number().int().default(0),
  created_by: z.string().uuid()
})

const documentationArticleSchema = z.object({
  organization_id: z.string().uuid(),
  category_id: z.string().uuid(),
  title: z.string().min(3),
  content: z.string(),
  type: z.enum(['technical', 'user_guide', 'procedure', 'faq', 'release_note']),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  version: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  view_count: z.number().int().default(0),
  last_reviewed_at: z.string().datetime().nullable().optional(),
  last_reviewed_by: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid()
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

  validateEvaluation(data: unknown): Evaluation {
    return evaluationSchema.parse(data) as Evaluation
  },

  validateNotification(data: unknown): Notification {
    return notificationSchema.parse(data) as Notification
  },

  validateNotificationPreference(data: unknown): NotificationPreference {
    return notificationPreferenceSchema.parse(data) as NotificationPreference
  },

  validateSecurityAuditLog(data: unknown): SecurityAuditLog {
    return securityAuditLogSchema.parse(data) as SecurityAuditLog
  },

  validateFailedAuthAttempt(data: unknown): FailedAuthAttempt {
    return failedAuthAttemptSchema.parse(data) as FailedAuthAttempt
  },

  validateSecuritySettings(data: unknown): SecuritySettings {
    return securitySettingsSchema.parse(data) as SecuritySettings
  },

  validateArea(data: unknown): Area {
    return areaSchema.parse(data) as Area
  },

  validateIncident(data: unknown): Incident {
    return incidentSchema.parse(data) as Incident
  },

  validateDocumentationCategory(data: unknown): DocumentationCategory {
    return documentationCategorySchema.parse(data) as DocumentationCategory
  },

  validateDocumentationArticle(data: unknown): DocumentationArticle {
    return documentationArticleSchema.parse(data) as DocumentationArticle
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