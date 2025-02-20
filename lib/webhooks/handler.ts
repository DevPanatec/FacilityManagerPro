import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function handleWebhook(payload: any) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Log del webhook
    await supabase.from('webhook_logs').insert({
      payload,
      status: 'received'
    })

    // Procesar según el tipo de webhook
    switch(payload.type) {
      case 'task.created':
        // Lógica para tareas creadas
        break
      case 'notification.sent':
        // Lógica para notificaciones
        break
      default:
        console.log('Unhandled webhook type:', payload.type)
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido en el webhook'
    }
  }
} 