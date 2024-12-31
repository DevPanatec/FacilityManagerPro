'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si estamos en el cliente
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        const userRole = localStorage.getItem('userRole')
        const isAuthenticated = localStorage.getItem('isAuthenticated')
        
        if (!isAuthenticated || !userRole) {
          router.replace('/auth/login')
          return
        }

        switch(userRole) {
          case 'admin':
            router.replace('/admin/dashboard')
            break
          case 'enterprise':
            router.replace('/enterprise/dashboard')
            break
          case 'usuario':
            router.replace('/user/usuario')
            break
          default:
            router.replace('/auth/login')
        }
      } catch (error) {
        console.error('Error al redirigir:', error)
        router.replace('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-xl font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  return null
}
