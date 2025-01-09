'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Message = Database['public']['Tables']['chat_messages']['Row']

export default function ChatComponent({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Suscribirse a nuevos mensajes
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Cambio recibido:', payload)
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message])
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? payload.new as Message : msg
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => 
              prev.filter(msg => msg.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cargar mensajes existentes
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error cargando mensajes:', error)
        return
      }

      setMessages(data)
    }

    loadMessages()

    // Limpieza al desmontar
    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map(message => (
        <div key={message.id} className="p-4 bg-white rounded shadow">
          <p>{message.content}</p>
          <small>{formatDate(message.created_at)}</small>
        </div>
      ))}
    </div>
  )
} 