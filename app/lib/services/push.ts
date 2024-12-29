import * as admin from 'firebase-admin'
import { notificationConfig } from '../config/notifications'

export class PushService {
  private app: admin.app.App

  constructor() {
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: notificationConfig.push.projectId,
          clientEmail: notificationConfig.push.clientEmail,
          privateKey: notificationConfig.push.privateKey.replace(/\\n/g, '\n')
        })
      })
    } else {
      this.app = admin.apps[0]!
    }
  }

  async send(options: {
    tokens: string[]
    notification: {
      title: string
      body: string
    }
    data?: Record<string, string>
  }) {
    try {
      const message = {
        notification: options.notification,
        data: options.data,
        tokens: options.tokens
      }

      const response = await this.app.messaging().sendMulticast(message)
      
      if (response.failureCount > 0) {
        const failedTokens = response.responses
          .map((resp, idx) => resp.success ? null : options.tokens[idx])
          .filter(Boolean)
        
        console.error('Failed to send to tokens:', failedTokens)
      }

      return response
    } catch (error) {
      console.error('Error sending push notification:', error)
      throw error
    }
  }
} 