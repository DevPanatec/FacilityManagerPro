import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Message, MessageAttachment } from '@/app/shared/contexts/ChatContext'
import { MessageItem } from '@/app/shared/components/MessageItem'

interface MessageListProps {
  messages: Message[]
  attachments: { [messageId: string]: MessageAttachment[] }
  typingUsers: { [key: string]: string }
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onReply: (message: Message) => void
}

const MemoizedMessageItem = memo(MessageItem)

export const MessageList = memo(function MessageList({
  messages,
  attachments,
  typingUsers,
  onEdit,
  onDelete,
  onReply
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [messages])

  const rowVirtualizer = useVirtualizer({
    count: sortedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 100, []),
    overscan: 5
  })

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target
    const bottom = scrollHeight - scrollTop - clientHeight < 100
    setIsNearBottom(bottom)
    setShowScrollButton(!bottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight
      setShowScrollButton(false)
    }
  }, [])

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom()
    }
  }, [messages.length, isNearBottom, scrollToBottom])

  const handleEdit = useCallback((messageId: string, content: string) => {
    onEdit(messageId, content)
  }, [onEdit])

  const handleDelete = useCallback((messageId: string) => {
    onDelete(messageId)
  }, [onDelete])

  const handleReply = useCallback((message: Message) => {
    onReply(message)
  }, [onReply])

  const typingIndicator = useMemo(() => {
    const users = Object.values(typingUsers)
    if (users.length === 0) return null

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 italic p-2">
        {users.join(', ')} {users.length === 1 ? 'está' : 'están'} escribiendo...
      </div>
    )
  }, [typingUsers])

  return (
    <div className="flex flex-col h-full">
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
        style={{ height: `calc(100vh - 200px)` }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const message = sortedMessages[virtualRow.index]
            return (
              <div
                key={message.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <MemoizedMessageItem
                  message={message}
                  attachments={attachments[message.id] || []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={handleReply}
                />
              </div>
            )
          })}
        </div>
      </div>

      {typingIndicator}

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary-dark transition-colors"
        >
          <span className="sr-only">Scroll to bottom</span>
          ↓
        </button>
      )}
    </div>
  )
}) 