'use client'

import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  setupGeneralListener,
  setupNotificationListener,
  setupTaskListener,
  setupChatListener
} from '../lib/realtime/listeners'

export default function RealtimeManager() {
  useEffect(() => {
    // Inicializar los listeners
    const channels: RealtimeChannel[] = [
      setupGeneralListener(),
      setupNotificationListener(),
      setupTaskListener(),
      setupChatListener()
    ]

    // Suscribirse a todos los canales
    channels.forEach(channel => {
      channel.subscribe((status) => {
        console.log(`Canal ${channel.topic} estado:`, status)
      })
    })

    // Limpiar suscripciones al desmontar
    return () => {
      channels.forEach(channel => {
        channel.unsubscribe()
      })
    }
  }, [])

  // Este componente no renderiza nada visualmente
  return null
} 