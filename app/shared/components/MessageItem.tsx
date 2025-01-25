import { memo, useState, useCallback } from 'react'
import { Message, MessageAttachment } from '@/app/shared/contexts/ChatContext'
import { MessageReactions } from './MessageReactions'
import { LinkPreview } from './LinkPreview'
import { MessageAttachmentList } from './MessageAttachmentList'

interface MessageItemProps {
  message: Message
  attachments: MessageAttachment[]
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onReply: (message: Message) => void
}

export const MessageItem = memo(function MessageItem({
  message,
  attachments,
  onEdit,
  onDelete,
  onReply
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleEditClick = useCallback(() => {
    setIsEditing(true)
    setEditContent(message.content)
  }, [message.content])

  const handleEditCancel = useCallback(() => {
    setIsEditing(false)
    setEditContent(message.content)
  }, [message.content])

  const handleEditSave = useCallback(() => {
    onEdit(message.id, editContent)
    setIsEditing(false)
  }, [message.id, editContent, onEdit])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }, [handleEditSave, handleEditCancel])

  const handleDeleteClick = useCallback(() => {
    onDelete(message.id)
  }, [message.id, onDelete])

  const handleReplyClick = useCallback(() => {
    onReply(message)
  }, [message, onReply])

  if (isEditing) {
    return (
      <div className="p-2 border rounded-lg">
        <textarea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleEditCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleEditSave}
            className="px-3 py-1 text-sm text-white bg-primary hover:bg-primary-dark rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 hover:bg-gray-50">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{message.user_id}</span>
            <span className="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleString()}
            </span>
            {message.is_edited && (
              <span className="text-xs text-gray-500">(editado)</span>
            )}
          </div>
          <div className="mt-1 text-gray-800 whitespace-pre-wrap">
            {message.content}
          </div>
          {attachments.length > 0 && (
            <MessageAttachmentList attachments={attachments} />
          )}
          <LinkPreview content={message.content} />
          <MessageReactions messageId={message.id} />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleReplyClick}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Responder
            </button>
            <button
              onClick={handleEditClick}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Editar
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}) 