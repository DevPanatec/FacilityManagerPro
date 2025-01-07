import { createClient } from '../../utils/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'tasks' | 'inventory' | 'maintenance_requests'
type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface ListenerConfig {
  table: TableName
  event?: ChangeEvent
  filter?: string
  schema?: string
}

interface SubscriptionCallback<T = any> {
  (payload: RealtimePostgresChangesPayload<T>): void
}

class RealtimeManager {
  private static instance: RealtimeManager
  private channels: Map<string, RealtimeChannel>
  private supabase = createClient()

  private constructor() {
    this.channels = new Map()
  }

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  subscribe<T>(
    config: ListenerConfig,
    callback: SubscriptionCallback<T>
  ): () => void {
    const channelKey = this.getChannelKey(config)
    
    if (!this.channels.has(channelKey)) {
      const channel = this.supabase
        .channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          },
          callback
        )
        .subscribe((status) => {
          console.log(`Channel ${channelKey} status:`, status)
        })

      this.channels.set(channelKey, channel)
    }

    return () => this.unsubscribe(config)
  }

  private unsubscribe(config: ListenerConfig): void {
    const channelKey = this.getChannelKey(config)
    const channel = this.channels.get(channelKey)
    
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelKey)
    }
  }

  private getChannelKey(config: ListenerConfig): string {
    return `${config.table}:${config.event || '*'}:${config.filter || '*'}`
  }
}

// Exportar funciones de utilidad
export const setupRealtimeListeners = () => {
  const manager = RealtimeManager.getInstance()
  
  // Configurar listeners globales
  const unsubscribeTasks = manager.subscribe(
    { table: 'tasks' },
    (payload) => {
      console.log('Task change received:', payload)
    }
  )

  // Retornar función de limpieza
  return () => {
    unsubscribeTasks()
  }
}

export const subscribeToUserTasks = (
  userId: string,
  callback: SubscriptionCallback
) => {
  const manager = RealtimeManager.getInstance()
  
  return manager.subscribe(
    {
      table: 'tasks',
      filter: `user_id=eq.${userId}`
    },
    callback
  )
}

export const subscribeToInventoryChanges = (
  callback: SubscriptionCallback
) => {
  const manager = RealtimeManager.getInstance()
  
  return manager.subscribe(
    {
      table: 'inventory',
      event: 'UPDATE'
    },
    callback
  )
}

// Otros listeners específicos según necesites... 
