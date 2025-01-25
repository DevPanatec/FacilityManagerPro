'use client'

import { memo, useState, useCallback, useEffect } from 'react'
import type { Message, MessageAttachment } from '@/app/shared/types/chat'
import MessageReactions from './MessageReactions'
import LinkPreview from './LinkPreview'
import MessageAttachmentList from './MessageAttachmentList'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

// Expresión regular para detectar URLs
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

export interface MessageItemProps {
  message: Message
  attachments?: MessageAttachment[]
  isReply?: boolean
  parentMessage?: Message
  onEdit: (content: string) => void
  onDelete: () => void
  onReply: () => void
}

const MessageItem = memo(function MessageItem({
  message,
  attachments = [],
  isReply = false,
  parentMessage,
  onEdit,
  onDelete,
  onReply
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(message.content)
  const [reactions, setReactions] = useState<{ [key: string]: string[] }>({})
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const loadReactions = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_message_reactions')
          .select('reaction, user_id')
          .eq('message_id', message.id)

        if (error) throw error

        const reactionGroups: { [key: string]: string[] } = {}
        data.forEach(({ reaction, user_id }) => {
          if (!reactionGroups[reaction]) {
            reactionGroups[reaction] = []
          }
          reactionGroups[reaction].push(user_id)
        })

        setReactions(reactionGroups)
      } catch (error) {
        console.error('Error loading reactions:', error)
      }
    }

    loadReactions()

    // Suscribirse a cambios en las reacciones
    const channel = supabase
      .channel(`message-reactions-${message.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions',
          filter: `message_id=eq.${message.id}`
        },
        () => {
          loadReactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [message.id, supabase])

  const handleReaction = useCallback(async (emoji: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const userId = user.user.id
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await supabase
          .from('chat_message_reactions')
          .delete()
          .match({
            message_id: message.id,
            user_id: userId,
            reaction: emoji
          })
      } else {
        await supabase
          .from('chat_message_reactions')
          .insert({
            message_id: message.id,
            user_id: userId,
            reaction: emoji
          })
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }, [message.id, reactions, supabase])

  const handleEditClick = useCallback(() => {
    setIsEditing(true)
    setEditedContent(message.content)
  }, [message.content])

  const handleEditCancel = useCallback(() => {
    setIsEditing(false)
    setEditedContent(message.content)
  }, [message.content])

  const handleEditSave = useCallback(() => {
    if (editedContent.trim() !== message.content) {
      onEdit(editedContent)
    }
    setIsEditing(false)
  }, [editedContent, message.content, onEdit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }, [handleEditSave, handleEditCancel])

  // Extraer URLs del contenido
  const urls = message.content.match(URL_REGEX) || []

  return (
    <div className={`chat ${isReply ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-image avatar placeholder">
        <div className="bg-primary text-primary-content rounded-full w-10 shadow-md">
          <span>{message.user_id.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      
      <div className="chat-header opacity-50 text-xs mb-1">
        {message.user_id}
        {message.is_edited && <span className="ml-2">(editado)</span>}
      </div>

      <div className="chat-bubble bg-primary text-primary-content shadow-md">
        {parentMessage && (
          <div className="bg-primary-focus/50 p-2 rounded mb-2 text-sm">
            <div className="font-bold opacity-75">
              Respondiendo a {parentMessage.user_id}
            </div>
            <div className="opacity-75 truncate">
              {parentMessage.content}
            </div>
          </div>
        )}

        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none focus:outline-none resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {attachments.length > 0 && (
              <MessageAttachmentList attachments={attachments} />
            )}
            {urls.map((url, index) => (
              <div key={index} className="mt-2">
                <LinkPreview url={url} />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="chat-footer opacity-50 text-xs mt-1">
        {new Date(message.created_at).toLocaleString()}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleEditClick}
            className="btn btn-ghost btn-xs"
            title="Editar mensaje"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-xs text-error"
            title="Eliminar mensaje"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onReply}
            className="btn btn-ghost btn-xs"
            title="Responder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <MessageReactions 
        messageId={message.id} 
        reactions={reactions}
        onReact={handleReaction}
      />
    </div>
  )
})

export default MessageItem 