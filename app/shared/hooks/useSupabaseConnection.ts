'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

interface ConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  lastError: Error | null
  retryCount: number
}

type EventHandler = {
  event: 'postgres_changes'
  schema?: string
  table: string
  filter?: string
  handler: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function useSupabaseConnection() {
  const supabase = createClientComponentClient<Database>()
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastError: null,
    retryCount: 0
  })

  const [channels, setChannels] = useState<RealtimeChannel[]>([])

  const connect = useCallback(async () => {
    try {
      setConnectionState(prev => ({ ...prev, isReconnecting: true }))

      // Verificar la sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('No authenticated session')

      // Reconectar todos los canales
      const reconnectedChannels = channels.map(channel => {
        channel.unsubscribe()
        return supabase.channel(channel.topic)
      })

      await Promise.all(reconnectedChannels.map(channel => channel.subscribe()))
      setChannels(reconnectedChannels)

      setConnectionState({
        isConnected: true,
        isReconnecting: false,
        lastError: null,
        retryCount: 0
      })
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isReconnecting: false,
        lastError: error as Error,
        retryCount: prev.retryCount + 1
      }))

      // Reintentar con backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, connectionState.retryCount), 30000)
      setTimeout(connect, delay)
    }
  }, [supabase, channels, connectionState.retryCount])

  const subscribeToChannel = useCallback((channelName: string, handlers: EventHandler[]) => {
    const channel = supabase.channel(channelName)
    
    // Configurar handlers
    handlers.forEach((handler) => {
      if (handler.event === 'postgres_changes') {
        channel.on(
          handler.event,
          {
            event: '*',
            schema: handler.schema || 'public',
            table: handler.table,
            filter: handler.filter || undefined
          },
          handler.handler
        )
      }
    })

    // Suscribirse al canal
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannels(prev => [...prev, channel])
      }
    })

    return () => {
      channel.unsubscribe()
      setChannels(prev => prev.filter(ch => ch !== channel))
    }
  }, [supabase])

  // Monitorear el estado de la conexión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        connect()
      } else if (event === 'SIGNED_OUT') {
        setConnectionState({
          isConnected: false,
          isReconnecting: false,
          lastError: null,
          retryCount: 0
        })
        channels.forEach(channel => channel.unsubscribe())
        setChannels([])
      }
    })

    // Monitorear cambios en la conexión
    const channel = supabase.channel('connection_monitor')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState(prev => ({ ...prev, isConnected: true }))
        } else if (status === 'CLOSED') {
          setConnectionState(prev => ({ ...prev, isConnected: false }))
          connect()
        }
      })

    // Conectar inicialmente
    connect()

    return () => {
      subscription.unsubscribe()
      channel.unsubscribe()
      channels.forEach(ch => ch.unsubscribe())
    }
  }, [supabase, connect, channels])

  return {
    ...connectionState,
    subscribeToChannel
  }
} 