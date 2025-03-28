'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Navbar from '../shared/components/navbar'
import { ChatWidget } from '@/app/components/Chat/ChatWidget'
import type { Database } from '@/lib/types/database'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setIsLoading(false)
          return
        }

        // Verificar permisos a través de la API
        const response = await fetch('/api/auth')
        const data = await response.json()

        if (!response.ok || data.user?.role !== 'superadmin') {
          console.error('Error de permisos:', data.error)
          setIsLoading(false)
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        setIsLoading(false)
      }
    }

    checkSession()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <ChatWidget />
    </div>
  )
} 