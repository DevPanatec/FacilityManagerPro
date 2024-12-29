'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/config'
import { RealtimeChannel } from '@supabase/supabase-js'

type Table = 
  | 'activity_logs'
  | 'analytics_data'
  | 'areas'
  | 'attendance_records'
  | 'audit_logs'
  | 'backup_history'
  | 'chat_messages'
  | 'chat_participants'
  | 'chat_rooms'
  | 'dashboard_layouts'
  | 'dashboard_widgets'
  | 'departments'
  | 'documents'
  | 'employee_records'
  | 'entity_tags'
  | 'error_alerts'
  | 'error_logs'
  | 'evaluations'
  | 'kpi_config'
  | 'location_settings'
  | 'message_attachments'
  | 'metrics'
  | 'notification_preferences'
  | 'notifications'
  | 'organization_settings'
  | 'organizations'
  | 'performance_metrics'
  | 'permissions'
  | 'positions'

type RealtimeSubscriptionProps = {
  table: Table
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete
}: RealtimeSubscriptionProps) {
  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = () => {
      channel = supabase.channel(`realtime_${table}`)

      // Suscripción a INSERT
      if (onInsert) {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: table
          },
          (payload) => onInsert(payload)
        )
      }

      // Suscripción a UPDATE
      if (onUpdate) {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: table
          },
          (payload) => onUpdate(payload)
        )
      }

      // Suscripción a DELETE
      if (onDelete) {
        channel = channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: table
          },
          (payload) => onDelete(payload)
        )
      }

      channel.subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, onInsert, onUpdate, onDelete])
} 