'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

interface ConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  lastError: Error | null
  retryCount: number
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

  const subscribeToChannel = useCallback((channelName: string, handlers: any) => {
    const channel = supabase.channel(channelName)
    
    // Configurar handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      channel.on(event as any, handler as any)
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
      .on('presence', { event: 'sync' }, () => {
        setConnectionState(prev => ({ ...prev, isConnected: true }))
      })
      .on('presence', { event: 'join' }, () => {
        setConnectionState(prev => ({ ...prev, isConnected: true }))
      })
      .on('presence', { event: 'leave' }, () => {
        setConnectionState(prev => ({ ...prev, isConnected: false }))
        connect()
      })
      .subscribe()

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