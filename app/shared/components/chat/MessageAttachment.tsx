'use client'

import { useState } from 'react'
import { FileService, FileType } from '@/app/shared/services/fileService'

interface MessageAttachmentProps {
  url: string
  type: FileType
  name: string
  size: number
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'document':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
  }
}

export default function MessageAttachment({ url, type, name, size }: MessageAttachmentProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const fileService = new FileService()

  if (type === 'image') {
    const thumbnail = fileService.getImageThumbnail(url, 200)
    
    return (
      <>
        <div
          className="relative group cursor-pointer"
          onClick={() => setIsImageModalOpen(true)}
        >
          {/* Vista previa de imagen */}
          <img
            src={thumbnail}
            alt={name}
            className="max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow"
          />
          
          {/* Overlay con información */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="text-white text-center p-2">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs">{formatFileSize(size)}</p>
            </div>
          </div>
        </div>

        {/* Modal de imagen */}
        {isImageModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="max-w-4xl max-h-[90vh] p-4">
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors max-w-sm"
    >
      <div className="text-primary">
        {getFileIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {name}
        </p>
        <p className="text-xs opacity-75">
          {formatFileSize(size)}
        </p>
      </div>
      <div className="text-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </a>
  )
} 