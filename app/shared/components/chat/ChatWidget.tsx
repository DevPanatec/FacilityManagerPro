'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChatProvider, useChatContext } from '@/app/shared/contexts/ChatContext'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import type { Database } from '@/lib/types/database'

interface ChatWidgetProps {
  isAdmin?: boolean
  isEnterprise?: boolean
}

function ConnectionStatus({ isConnected, isReconnecting }: { isConnected: boolean; isReconnecting: boolean }) {
  if (isConnected) return null

  return (
    <div className={`absolute top-0 left-0 right-0 p-2 text-center text-sm ${
      isReconnecting ? 'bg-warning text-warning-content' : 'bg-error text-error-content'
    }`}>
      {isReconnecting ? 'Reconectando...' : 'Desconectado'}
    </div>
  )
}

function ChatWidgetContent({ onClose }: { onClose: () => void }) {
  const { state } = useChatContext()
  const { connectionState } = state

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-base-100 rounded-2xl shadow-2xl flex flex-col" style={{ height: '600px' }}>
      <ConnectionStatus 
        isConnected={connectionState.isConnected} 
        isReconnecting={connectionState.isReconnecting} 
      />
      <ChatHeader onClose={onClose} />
      <MessageList />
      <MessageInput />
    </div>
  )
}

export default function ChatWidget({ isAdmin = false, isEnterprise = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Suscribirse a mensajes no leídos
      supabase
        .channel('chat_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `user_id=neq.${session.user.id}`,
          },
          () => {
            if (!isOpen) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        )
        .subscribe()
    }

    setupRealtime()
  }, [supabase, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  return (
    <>
      {/* Botón flotante del chat */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 btn btn-circle btn-lg bg-primary text-primary-content border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Ventana del chat */}
      {isOpen && (
        <ChatProvider>
          <ChatWidgetContent onClose={() => setIsOpen(false)} />
        </ChatProvider>
      )}
    </>
  )
} 