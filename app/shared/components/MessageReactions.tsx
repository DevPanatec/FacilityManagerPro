import { memo, useState, useCallback, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { EmojiPicker } from './EmojiPicker'

export interface Reaction {
  user_id: string
  reaction: string
}

interface FormattedReaction {
  reaction: string
  count: number
  users: string[]
}

export interface MessageReactionsProps {
  messageId: string
  reactions: Reaction[]
  currentUserId: string
  onReact: (messageId: string, reaction: string) => void
  onRemoveReaction: (messageId: string, reaction: string) => void
}

export const MessageReactions = memo(function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onReact,
  onRemoveReaction
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [formattedReactions, setFormattedReactions] = useState<FormattedReaction[]>([])
  const supabase = createClientComponentClient<Database>()

  const loadReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_message_reactions')
        .select('reaction, user_id')
        .eq('message_id', messageId)

      if (error) throw error

      // Agrupar reacciones
      const reactionGroups = data.reduce((groups: { [key: string]: string[] }, item) => {
        if (!groups[item.reaction]) {
          groups[item.reaction] = []
        }
        groups[item.reaction].push(item.user_id)
        return groups
      }, {})

      const formatted = Object.entries(reactionGroups).map(([reaction, users]) => ({
        reaction,
        count: users.length,
        users
      }))

      setFormattedReactions(formatted)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }, [messageId, supabase])

  useEffect(() => {
    loadReactions()

    // Suscribirse a cambios en las reacciones
    const channel = supabase
      .channel(`message_reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          loadReactions()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [messageId, supabase, loadReactions])

  const handleReactionClick = (emoji: string) => {
    const hasReacted = reactions.some(
      r => r.user_id === currentUserId && r.reaction === emoji
    )
    if (hasReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onReact(messageId, emoji)
    }
  }

  const handleEmojiSelect = (emoji: { native: string }) => {
    const hasReacted = reactions.some(
      r => r.user_id === currentUserId && r.reaction === emoji.native
    )
    if (!hasReacted) {
      onReact(messageId, emoji.native)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className="flex items-center gap-2">
      {formattedReactions.map(({ reaction, count, users }) => (
        <button
          key={reaction}
          onClick={() => handleReactionClick(reaction)}
          className={`px-2 py-1 rounded-full text-sm ${
            users.includes(currentUserId) ? 'bg-blue-100' : 'bg-gray-100'
          } hover:bg-gray-200 transition-colors`}
        >
          {reaction} {count}
        </button>
      ))}
      <button
        onClick={() => setShowEmojiPicker(true)}
        className="text-gray-500 hover:text-gray-700"
      >
        Add Reaction
      </button>
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2">
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  )
}) 