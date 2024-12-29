import { SendGrid } from '@sendgrid/mail'
import { notificationConfig } from '../config/notifications'

export class EmailService {
  private client: SendGrid

  constructor() {
    this.client = new SendGrid()
    this.client.setApiKey(notificationConfig.email.apiKey)
  }

  async send(options: {
    to: string
    subject: string
    text: string
    templateId?: string
    templateData?: Record<string, any>
  }) {
    const msg = {
      to: options.to,
      from: notificationConfig.email.fromEmail,
      subject: options.subject,
      text: options.text,
      ...(options.templateId && {
        templateId: options.templateId,
        dynamicTemplateData: options.templateData
      })
    }

    try {
      await this.client.send(msg)
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }
} 