'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ChatHeader from './chat/ChatHeader'
import MessageList from './chat/MessageList'
import MessageInput from './chat/MessageInput'
import ChatList from './chat/ChatList'
import { ChatProvider, useChatContext } from '@/app/shared/contexts/ChatContext'
import type { Database } from '@/lib/types/database'

interface ChatWidgetProps {
  isAdmin?: boolean
  isAdminPrincipal?: boolean
  isEnterprise?: boolean
}

function ChatWidgetContent({
  isAdmin = false,
  isAdminPrincipal = false,
  isEnterprise = false
}: ChatWidgetProps) {
  const { state } = useChatContext()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (!isOpen) {
      const subscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, () => {
          setUnreadCount(prev => prev + 1)
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isOpen, supabase])

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-base-100 rounded-2xl shadow-2xl flex flex-col">
          <ChatHeader 
            onClose={() => setIsOpen(false)}
            isAdmin={isAdmin}
            isAdminPrincipal={isAdminPrincipal}
          />
          
          {state.activeRoom ? (
            <>
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <ChatList />
          )}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 btn btn-circle btn-lg btn-primary shadow-lg"
        >
          <div className="relative">
            <span className="text-2xl">💬</span>
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-error text-error-content rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </div>
            )}
          </div>
        </button>
      )}
    </>
  )
}

export default function ChatWidget(props: ChatWidgetProps) {
  return (
    <ChatProvider>
      <ChatWidgetContent {...props} />
    </ChatProvider>
  )
} 