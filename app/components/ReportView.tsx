import { ExportButton } from './ExportButton'
import { ExportFormat } from '@/lib/services/export'

export function ReportView({ reportId, type }) {
  const handleExport = async (format: ExportFormat) => {
    try {
      const response = await fetch(
        `/api/reports?type=${type}&format=${format}&reportId=${reportId}`,
        {
          method: 'GET'
        }
      )

      if (!response.ok) throw new Error('Error al exportar')

      // Descargar el archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_report.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      {/* ... otros componentes ... */}
      <ExportButton onExport={handleExport} />
    </div>
  )
} 