'use client'

import { useState } from 'react'
import { ExportFormat } from '@/lib/services/export'

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void>
  formats?: ExportFormat[]
}

export function ExportButton({ 
  onExport, 
  formats = ['csv', 'pdf', 'excel'] 
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showFormats, setShowFormats] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    try {
      setLoading(true)
      await onExport(format)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setLoading(false)
      setShowFormats(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowFormats(!showFormats)}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Exportando...' : 'Exportar'}
      </button>

      {showFormats && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {formats.map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Exportar como {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 