'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Navbar from '../shared/componentes/navbar'
import ChatWidget from '../shared/componentes/ChatWidget'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState(0)
  const router = useRouter()

  useEffect(() => {
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
        }

        // Verificar si es admin principal
        setIsAdminPrincipal(userData?.role === 'admin')
        setCurrentAdminId(3) // Por defecto Carlos (ID: 3)
      } catch (error) {
        console.error('Error al verificar sesión:', error)
        router.replace('/auth/login')
      }
    }

    // Verificar sesión inicial
    checkSession()

    // Suscribirse a cambios en la sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login')
      } else if (!session) {
        router.replace('/auth/login')
      }
    })

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

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