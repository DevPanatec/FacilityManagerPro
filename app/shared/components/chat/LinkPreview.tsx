'use client'

import { useState, useEffect } from 'react'

interface LinkPreviewData {
  url: string
  title: string
  description: string
  image: string | null
  domain: string
}

interface LinkPreviewProps {
  url: string
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Aquí usaremos un servicio de proxy para evitar problemas de CORS
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar la vista previa')
        }

        const data = await response.json()
        setPreviewData(data)
      } catch (err) {
        console.error('Error fetching link preview:', err)
        setError('No se pudo cargar la vista previa')
      } finally {
        setIsLoading(false)
      }
    }

    if (url) {
      fetchPreview()
    }
  }, [url])

  if (isLoading) {
    return (
      <div className="animate-pulse bg-base-200 rounded-lg p-2 space-y-2">
        <div className="h-4 bg-base-300 rounded w-3/4"></div>
        <div className="h-3 bg-base-300 rounded w-1/2"></div>
      </div>
    )
  }

  if (error || !previewData) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-base-200 rounded-lg overflow-hidden hover:bg-base-300 transition-colors"
    >
      <div className="flex">
        {previewData.image && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={previewData.image}
              alt={previewData.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Ocultar la imagen si falla la carga
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <div className="text-sm font-medium line-clamp-2">
            {previewData.title}
          </div>
          {previewData.description && (
            <div className="text-xs opacity-75 mt-1 line-clamp-2">
              {previewData.description}
            </div>
          )}
          <div className="text-xs opacity-50 mt-1">
            {previewData.domain}
          </div>
        </div>
      </div>
    </a>
  )
} 