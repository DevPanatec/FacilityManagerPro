export interface WebhookEvent {
  id: string
  type: string
  data: any
  created_at: string
}

export interface WebhookConfig {
  url: string
  secret: string
  events: string[]
  active: boolean
} 