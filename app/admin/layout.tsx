'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../shared/components/navbar'
import { ChatWidget } from '@/app/components/Chat/ChatWidget'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChatProvider } from '@/app/shared/contexts/ChatContext'

interface Organization {
  id: string
  name: string
}

interface UserData {
  role: string
  organization_id: string
  organizations: Organization[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Verificar si ya hay un rol guardado
        const storedRole = localStorage.getItem('userRole')
        if (storedRole === 'admin') {
          setIsLoading(false)
          return
        }

        // Verificar sesión de Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Obtener datos del usuario
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
            role,
            organization_id,
            organizations:organization_id (
              id,
              name
            )
          `)
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error al obtener datos del usuario:', error)
          router.push('/auth/login')
          return
        }

        if (!userData || userData.role !== 'admin') {
          console.error('Usuario no autorizado')
          router.push('/auth/login')
          return
        }

        // Guardar/actualizar datos importantes en localStorage
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('organizationId', userData.organization_id)
        localStorage.setItem('organizationName', userData.organizations?.[0]?.name || '')

        setIsLoading(false)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        router.push('/auth/login')
      }
    }

    checkSession()
  }, [router, pathname])

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4">
          {children}
        </main>
        <ChatWidget />
      </div>
    </ChatProvider>
  )
}