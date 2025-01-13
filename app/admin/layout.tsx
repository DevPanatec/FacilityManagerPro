'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '@/app/shared/componentes/navbar'
import ChatWidget from '../shared/componentes/ChatWidget'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        // Verificar la sesión
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!session) {
          router.replace('/auth/login')
          return
        }

        // Verificar el rol de admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        if (userData?.role !== 'admin') {
          router.replace('/auth/login')
          return
        }

        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setIsAdminPrincipal(userData?.role === 'admin')
          setCurrentAdminId(3) // Por defecto Carlos (ID: 3)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        if (isMounted) {
          router.replace('/auth/login')
        }
      }
    }

    // Verificar sesión inicial
    checkSession()

    // Suscribirse a cambios en la sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/auth/login')
      }
    })

    // Limpiar suscripción y flag al desmontar
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Mostrar un estado de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
          {children}
        </div>
      </main>
      
      <ChatWidget 
        isAdmin={true}
        isAdminPrincipal={isAdminPrincipal}
        adminList={[
          { 
            id: 1, 
            nombre: "Juan Pérez", 
            cargo: "Admin Principal",
            role: 'admin_principal'
          },
          { 
            id: 2, 
            nombre: "María García", 
            cargo: "Admin Soporte",
            role: 'admin'
          },
          { 
            id: 3, 
            nombre: "Carlos López", 
            cargo: "Admin Sistema",
            role: 'admin'
          }
        ]}
        currentAdminId={currentAdminId}
      />
    </div>
  )
}