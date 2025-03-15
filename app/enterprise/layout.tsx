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
  const [organizationName, setOrganizationName] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Verificar sesión de Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Obtener el perfil del usuario
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('Error al obtener perfil:', profileError)
          router.push('/auth/login')
          return
        }

        if (userProfile.role !== 'enterprise') {
          console.error('Usuario no autorizado')
          router.push('/auth/login')
          return
        }

        // Guardar datos en localStorage
        localStorage.setItem('userRole', userProfile.role)
        localStorage.setItem('organizationId', userProfile.organization_id)
        
        // Siempre obtener el nombre de la organización
        const { data: organizationData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', userProfile.organization_id)
          .single();

        if (organizationData && organizationData.name) {
          // Actualizar el estado y localStorage
          setOrganizationName(organizationData.name);
          localStorage.setItem('organizationName', organizationData.name);
          console.log('Nombre de la organización establecido:', organizationData.name);
        }

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
        <Navbar 
          role="enterprise"
          isEnterprise={true}
          organizationName={organizationName}
        />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <ChatWidget isEnterprise={true} />
      </div>
    </ChatProvider>
  )
}