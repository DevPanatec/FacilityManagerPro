export const DOCUMENT_TYPE = {
  CONTRACT: 'contract',
  POLICY: 'policy',
  PROCEDURE: 'procedure',
  FORM: 'form',
  REPORT: 'report',
  OTHER: 'other'
} as const

export type DocumentType = {
  id: string
  organization_id: string
  title: string
  description?: string
  file_url: string
  file_type?: string
  uploaded_by: string
  created_at: string
  updated_at: string
} 