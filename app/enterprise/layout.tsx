'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../shared/componentes/navbar'
import ChatWidget from '../shared/componentes/ChatWidget'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error al obtener datos del usuario:', error)
          router.push('/auth/login')
          return
        }

        if (!userData || userData.role !== 'enterprise') {
          console.log('Usuario no autorizado:', userData)
          router.push('/auth/login')
          return
        }

        localStorage.setItem('userRole', 'enterprise')
        setIsLoading(false)
      } catch (error) {
        console.error('Error verificando sesión:', error)
        router.push('/auth/login')
      }
    }

    checkSession()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar role="enterprise" isEnterprise={true} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  )
}