export function validateWebhookPayload(payload: any) {
  // Validar que el payload tenga la estructura correcta
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload format')
  }

  // Validar campos requeridos
  if (!payload.type) {
    throw new Error('Missing webhook type')
  }

  // Validar tipos de webhook permitidos
  const allowedTypes = ['task.created', 'notification.sent']
  if (!allowedTypes.includes(payload.type)) {
    throw new Error(`Invalid webhook type: ${payload.type}`)
  }

  return true
} 