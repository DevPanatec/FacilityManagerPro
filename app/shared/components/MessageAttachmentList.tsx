import { memo } from 'react'
import { MessageAttachment } from '@/app/shared/contexts/ChatContext'

interface MessageAttachmentListProps {
  attachments: MessageAttachment[]
}

export const MessageAttachmentList = memo(function MessageAttachmentList({
  attachments
}: MessageAttachmentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    return '📎'
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map(attachment => (
        <a
          key={attachment.id}
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">{getFileIcon(attachment.file_type)}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[200px]">
              {attachment.file_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatFileSize(attachment.file_size)}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}) 