export type WebhookConfig = {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  timeout: number;
};

export const DEFAULT_WEBHOOK_CONFIG = {
  retryCount: 3,
  timeout: 5000, // 5 segundos
  events: ['*'],
  isActive: true
}; 