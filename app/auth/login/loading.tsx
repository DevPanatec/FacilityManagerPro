'use client'

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-lg">Cargando...</p>
    </div>
  )
} 