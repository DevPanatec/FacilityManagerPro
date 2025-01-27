'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../shared/components/navbar'
import { ChatWidget } from '@/app/components/Chat/ChatWidget'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ChatProvider } from '@/app/shared/contexts/ChatContext'

export default function EnterpriseLayout({
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
        if (storedRole === 'enterprise') {
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
            organizations (
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

        if (!userData || userData.role !== 'enterprise') {
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
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <ChatWidget isEnterprise={true} />
      </div>
    </ChatProvider>
  )
}