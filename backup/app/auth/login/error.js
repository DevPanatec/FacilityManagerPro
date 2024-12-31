'use client'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
        <p className="mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
} 