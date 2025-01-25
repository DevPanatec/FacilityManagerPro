import { memo, useState, useEffect } from 'react'

interface LinkPreviewData {
  url: string
  title: string
  description: string | null
  image: string | null
  domain: string
}

interface LinkPreviewProps {
  content: string
}

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi

export const LinkPreview = memo(function LinkPreview({ content }: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urls = content.match(URL_REGEX)
    if (!urls) return

    const fetchPreview = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(urls[0])}`)
        if (!response.ok) throw new Error('Error fetching link preview')

        const data = await response.json()
        setPreviewData(data)
      } catch (error) {
        console.error('Error fetching link preview:', error)
        setError('Error loading preview')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [content])

  if (isLoading) {
    return (
      <div className="animate-pulse mt-2 p-2 border rounded-lg" data-testid="loading-skeleton">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3 mt-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (error || !previewData) return null

  return (
    <a
      href={previewData.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex gap-4">
        {previewData.image && (
          <div className="flex-shrink-0">
            <img
              src={previewData.image}
              alt={previewData.title}
              className="w-24 h-24 object-cover rounded"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {previewData.title}
          </h4>
          {previewData.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {previewData.description}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">{previewData.domain}</p>
        </div>
      </div>
    </a>
  )
}) 