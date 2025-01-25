'use client'

interface UploadProgressProps {
  file: File
  progress: number
  onCancel: () => void
}

export default function UploadProgress({
  file,
  progress,
  onCancel
}: UploadProgressProps) {
  return (
    <div className="bg-base-200 rounded-lg p-3 flex items-center gap-3">
      {/* Icono del archivo */}
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-base-300 rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-base-content opacity-50"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Información del archivo y barra de progreso */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium truncate">
            {file.name}
          </div>
          <div className="text-xs opacity-75">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="w-full bg-base-300 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Botón de cancelar */}
      <button
        onClick={onCancel}
        className="btn btn-ghost btn-xs btn-circle text-error"
        title="Cancelar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
} 