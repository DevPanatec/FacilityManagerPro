import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { NotificationType, NotificationChannel, NotificationData } from '../types/notifications'
import { EmailService } from './email'
import { PushService } from './push'
import { notificationConfig } from '../config/notifications'
import toast from 'react-hot-toast'

export class NotificationService {
  private supabase = createClientComponentClient()
  private channel
  private emailService = new EmailService()
  private pushService = new PushService()
  private emailConfig = {
    apiKey: process.env.NEXT_PUBLIC_SENDGRID_API_KEY || 'default_key',
    fromEmail: process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL || 'default@email.com'
  }

  constructor() {
    this.channel = this.supabase.channel('notifications')
  }

  async initialize(userId: string) {
    // Suscribirse a notificaciones en tiempo real
    this.channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleNewNotification(payload.new)
        }
      )
      .subscribe()
  }

  async sendNotification(
    userId: string,
    organizationId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ) {
    try {
      // Verificar permisos de organización
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single()

      if (profile?.organization_id !== organizationId) {
        throw new Error('Usuario no pertenece a la organización')
      }

      // Obtener preferencias
      const { data: preferences } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('notification_type', type)
        .single()

      if (!preferences) return

      // Enviar notificaciones según preferencias
      if (preferences.channels.in_app) {
        await this.supabase
          .from('notifications')
          .insert([{
            user_id: userId,
            organization_id: organizationId,
            type,
            title,
            message,
            data,
            related_resource_type: data?.resourceType,
            related_resource_id: data?.resourceId,
            read: false
          }])
      }

      if (preferences.channels.email) {
        await this.sendEmail(userId, organizationId, title, message, type, data)
      }

      if (preferences.channels.push) {
        await this.sendPushNotification(userId, organizationId, title, message, data)
      }

    } catch (error) {
      console.error('Error sending notification:', error)
      // Registrar en error_logs
      await this.supabase
        .from('error_logs')
        .insert([{
          error_type: 'NOTIFICATION_ERROR',
          message: error.message,
          stack: error.stack,
          metadata: {
            userId,
            organizationId,
            notificationType: type
          }
        }])
    }
  }

  private async sendEmail(
    userId: string, 
    organizationId: string, 
    title: string, 
    message: string, 
    type: NotificationType, 
    data?: NotificationData
  ) {
    const { data: user } = await this.supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single()

    if (user?.email) {
      const templateId = notificationConfig.email.templates[type]
      await this.emailService.send({
        to: user.email,
        subject: title,
        text: message,
        templateId,
        templateData: {
          title,
          message,
          ...data
        }
      })
    }
  }

  private async sendPushNotification(
    userId: string, 
    organizationId: string, 
    title: string, 
    message: string, 
    data?: NotificationData
  ) {
    const { data: tokens } = await this.supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (tokens?.length) {
      await this.pushService.send({
        tokens: tokens.map(t => t.token),
        notification: {
          title,
          body: message
        },
        data: data ? 
          Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ) : 
          undefined
      })
    }
  }

  private handleNewNotification(notification: any) {
    toast(
      <div className="notification-toast">
        <h4>{notification.title}</h4>
        <p>{notification.message}</p>
      </div>,
      {
        duration: 5000,
        position: 'top-right'
      }
    )
  }
} 