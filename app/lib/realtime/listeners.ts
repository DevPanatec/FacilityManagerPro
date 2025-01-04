import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface DatabaseRecord {
  [key: string]: any
}

// Listener general para todas las tablas
export function setupGeneralListener(): RealtimeChannel {
  const supabase = createClientComponentClient()
  return supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: '*'
      },
      (payload: RealtimePostgresChangesPayload<DatabaseRecord>) => {
        console.log('Cambio en la base de datos:', payload)
        const { eventType, table, new: newRecord, old: oldRecord } = payload
        
        switch (eventType) {
          case 'INSERT':
            console.log(`Nuevo registro en ${table}:`, newRecord)
            break
          case 'UPDATE':
            console.log(`Actualización en ${table}:`, {
              anterior: oldRecord,
              nuevo: newRecord
            })
            break
          case 'DELETE':
            console.log(`Eliminación en ${table}:`, oldRecord)
            break
        }
      }
    )
}

interface NotificationRecord {
  id: string
  user_id: string
  title: string
  content: string
  read: boolean
  created_at: string
}

// Listener específico para notificaciones
export function setupNotificationListener(): RealtimeChannel {
  const supabase = createClientComponentClient()
  return supabase
    .channel('notification-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications'
      },
      (payload: RealtimePostgresChangesPayload<NotificationRecord>) => {
        if (payload.new && 'read' in payload.new && payload.new.read === false) {
          console.log('Nueva notificación:', payload.new)
          // Aquí puedes disparar una notificación al usuario
        }
      }
    )
}

interface TaskRecord {
  id: string
  title: string
  description: string
  status: string
  [key: string]: any
}

// Listener específico para tareas
export function setupTaskListener(): RealtimeChannel {
  const supabase = createClientComponentClient()
  return supabase
    .channel('task-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      (payload: RealtimePostgresChangesPayload<TaskRecord>) => {
        console.log('Cambio en tareas:', payload)
        // Aquí puedes manejar actualizaciones de tareas
      }
    )
}

interface ChatMessageRecord {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  created_at: string
}

// Listener específico para chat
export function setupChatListener(): RealtimeChannel {
  const supabase = createClientComponentClient()
  return supabase
    .channel('chat-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      },
      (payload: RealtimePostgresChangesPayload<ChatMessageRecord>) => {
        if (payload.eventType === 'INSERT') {
          console.log('Nuevo mensaje:', payload.new)
          // Aquí puedes actualizar el chat
        }
      }
    )
} 