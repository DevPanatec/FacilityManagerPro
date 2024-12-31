'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Verificar si estamos en el cliente
      if (typeof window === 'undefined') return

      const userRole = localStorage.getItem('userRole')
      
      if (!userRole) {
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
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return null
}
