'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

interface MessageReactionsProps {
  messageId: string
  reactions: { [key: string]: string[] }
  onReact: (emoji: string) => void
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡']

export default function MessageReactions({
  messageId,
  reactions,
  onReact
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleReact = async (emoji: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id
      const existingReaction = Object.entries(reactions).find(([reaction, users]) =>
        users.includes(userId)
      )

      if (existingReaction && existingReaction[0] === emoji) {
        // Remover reacción existente
        const { error } = await supabase
          .from('chat_message_reactions')
          .delete()
          .match({
            message_id: messageId,
            user_id: userId,
            reaction: emoji
          })

        if (error) throw error
      } else {
        if (existingReaction) {
          // Cambiar reacción existente
          const { error } = await supabase
            .from('chat_message_reactions')
            .update({ reaction: emoji })
            .match({
              message_id: messageId,
              user_id: userId
            })

          if (error) throw error
        } else {
          // Agregar nueva reacción
          const { error } = await supabase
            .from('chat_message_reactions')
            .insert({
              message_id: messageId,
              user_id: userId,
              reaction: emoji
            })

          if (error) throw error
        }
      }

      onReact(emoji)
    } catch (error) {
      console.error('Error al reaccionar:', error)
    }
  }

  return (
    <div className="relative">
      {/* Reacciones actuales */}
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {Object.entries(reactions).map(([emoji, users]) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-base-200 hover:bg-base-300 transition-colors text-sm"
          >
            <span>{emoji}</span>
            <span className="opacity-75">{users.length}</span>
          </button>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-base-200 hover:bg-base-300 transition-colors text-sm opacity-50 hover:opacity-100"
        >
          +
        </button>
      </div>

      {/* Selector de emojis */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-base-100 rounded-lg shadow-lg border flex flex-wrap gap-1 z-50">
          {commonEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                handleReact(emoji)
                setShowPicker(false)
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-base-200 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 