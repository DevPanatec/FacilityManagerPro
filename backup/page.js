'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirigir inmediatamente a /auth/login
    router.replace('/auth/login')
  }, [router])

  // Mostrar un estado de carga mientras se redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4 text-xl font-semibold">Cargando...</p>
      </div>
    </div>
  )
}
