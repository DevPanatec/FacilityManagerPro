'use client'

import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  setupGeneralListener,
  setupNotificationListener,
  setupTaskListener,
  setupChatListener
} from '../lib/realtime/listeners'

export default function RealtimeManager() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Solo inicializar los listeners cuando el componente está montado en el cliente
    if (typeof window !== 'undefined') {
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
    }
  }, [])

  // No renderizar nada hasta que el componente esté montado
  if (!isMounted) return null

  // Este componente no renderiza nada visualmente
  return null
} 