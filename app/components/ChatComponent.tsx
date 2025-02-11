'use client'

import { useEffect, useState } from 'react'
import { supabaseService } from '@/services/supabaseService'

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
}

export default function ChatComponent({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    // Cargar mensajes existentes
    const loadMessages = async () => {
      const { data: authData, error: authError } = await supabaseService.auth.getUser()
      if (authError || !authData?.user) {
        console.error('Error de autenticación:', authError)
        return
      }

      const { data, error } = await supabaseService
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error cargando mensajes:', error)
        return
      }

      setMessages(data || [])
    }

    loadMessages()

    // Suscribirse a nuevos mensajes
    const channel = supabaseService
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const { data: authData, error: authError } = await supabaseService.auth.getUser()
    if (authError || !authData?.user) {
      console.error('Error de autenticación:', authError)
      return
    }

    const { error } = await supabaseService
      .from('messages')
      .insert({
        content: newMessage.trim(),
        room_id: roomId,
        user_id: authData.user.id
      })

    if (error) {
      console.error('Error enviando mensaje:', error)
      return
    }

    setNewMessage('')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-800">{message.content}</p>
            <small className="text-gray-500">{formatDate(message.created_at)}</small>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
} 