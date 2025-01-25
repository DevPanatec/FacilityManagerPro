'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useChatContext } from '@/app/shared/contexts/ChatContext'
import type { Message, RoomMember } from '@/app/shared/types/chat'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import MessageItem from './MessageItem'
import LinkPreview from './LinkPreview'
import MessageAttachment from './MessageAttachment'
import MessageReactions from './MessageReactions'
import { useVirtualizer } from '@tanstack/react-virtual'

// Expresión regular para detectar URLs
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

function formatMessageContent(content: string, members: RoomMember[]): JSX.Element {
  const parts = content.split(/(@\w+|https?:\/\/[^\s<]+[^<.,:;"')\]\s])/)
  const urls: string[] = []
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const username = part.slice(1)
          const member = members.find(m => m.user_id === username)
          
          return member ? (
            <span
              key={index}
              className="text-primary font-medium hover:underline cursor-pointer"
              title={`@${member.user_id}`}
            >
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        } else if (URL_REGEX.test(part)) {
          urls.push(part)
          return (
            <span key={index} className="text-primary hover:underline">
              <a href={part} target="_blank" rel="noopener noreferrer">
                {part}
              </a>
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
      {urls.map((url, index) => (
        <div key={`preview-${index}`} className="mt-2">
          <LinkPreview url={url} />
        </div>
      ))}
    </>
  )
}

const MessageList = memo(function MessageList() {
  const { state } = useChatContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages])

  if (!state.activeRoom) {
    return null
  }

  const messages = state.messages[state.activeRoom.id] || []
  const typingUsers = state.typingUsers[state.activeRoom.id] || []

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay mensajes</p>
          <p className="text-sm">Sé el primero en enviar un mensaje</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            attachments={state.attachments[message.id] || []}
            parentMessage={message.parent_id ? state.messages[state.activeRoom.id].find(m => m.id === message.parent_id) : undefined}
          />
        ))
      )}
      
      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} está escribiendo...`
            : `${typingUsers.length} personas están escribiendo...`}
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
})

export default MessageList 