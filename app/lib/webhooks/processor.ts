import { WebhookEvent } from '@/types/webhooks'

export async function processWebhookEvent(event: WebhookEvent) {
  try {
    switch (event.type) {
      case 'task.created':
        return await handleTaskCreated(event.data)
      case 'task.updated':
        return await handleTaskUpdated(event.data)
      case 'task.deleted':
        return await handleTaskDeleted(event.data)
      default:
        throw new Error(`Unsupported webhook event type: ${event.type}`)
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function handleTaskCreated(data: any) {
  // Lógica para manejar tarea creada
  return { success: true }
}

async function handleTaskUpdated(data: any) {
  // Lógica para manejar tarea actualizada
  return { success: true }
}

async function handleTaskDeleted(data: any) {
  // Lógica para manejar tarea eliminada
  return { success: true }
} 