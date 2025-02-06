import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabaseService } from '@/services/supabaseService'

interface DatabaseRecord {
  id: string
  [key: string]: any
}

export class RealtimeListener<T extends DatabaseRecord> {
  private channel: RealtimeChannel
  private table: string
  private callback: (payload: RealtimePostgresChangesPayload<T>) => void

  constructor(table: string, callback: (payload: RealtimePostgresChangesPayload<T>) => void) {
    this.table = table
    this.callback = callback
    this.channel = supabaseService
      .channel(`db-changes-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table
        },
        this.callback
      )
  }

  subscribe() {
    this.channel.subscribe()
  }

  unsubscribe() {
    this.channel.unsubscribe()
  }
} 