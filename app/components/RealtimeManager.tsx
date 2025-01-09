'use client'

import { useEffect, useState } from 'react'
import { RealtimeListener } from '../lib/realtime/listeners'
import { Database } from '@/types/supabase'

type TaskRecord = Database['public']['Tables']['tasks']['Row']
type MessageRecord = Database['public']['Tables']['messages']['Row']

export default function RealtimeManager() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Solo inicializar los listeners cuando el componente está montado en el cliente
    if (typeof window !== 'undefined') {
      // Crear listeners para diferentes tablas
      const taskListener = new RealtimeListener<TaskRecord>(
        'tasks',
        (payload) => {
          console.log('Cambio en tareas:', payload)
        }
      )

      const messageListener = new RealtimeListener<MessageRecord>(
        'messages',
        (payload) => {
          if (payload.eventType === 'INSERT') {
            console.log('Nuevo mensaje:', payload.new)
          }
        }
      )

      // Suscribirse a todos los canales
      const listeners = [taskListener, messageListener]
      listeners.forEach(listener => listener.subscribe())

      // Limpiar suscripciones al desmontar
      return () => {
        listeners.forEach(listener => listener.unsubscribe())
      }
    }
  }, [])

  // No renderizar nada hasta que el componente esté montado
  if (!isMounted) return null

  // Este componente no renderiza nada visualmente
  return null
} 