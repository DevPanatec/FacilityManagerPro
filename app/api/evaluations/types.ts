export const EVALUATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export const EVALUATION_TYPE = {
  PERFORMANCE: 'performance',
  SKILLS: 'skills',
  OBJECTIVES: 'objectives',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual'
} as const

export type EvaluationType = {
  id: string
  employee_id: string
  evaluator_id: string
  evaluation_date: string
  evaluation_type: keyof typeof EVALUATION_TYPE
  scores: {
    [key: string]: number
  }
  comments?: string
  created_at: string
  updated_at: string
} 