'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../shared/componentes/navbar'
import ChatWidget from '../shared/componentes/ChatWidget'
import { getSession } from '../utils/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    
    if (!session) {
      window.location.href = '/auth/login'
      return
    }

    const userRole = session.role

    // Verificar si es admin o superadmin
    if (!['admin', 'superadmin'].includes(userRole)) {
      window.location.href = '/auth/login'
      return
    }

    // Configurar admin principal si es superadmin
    setIsAdminPrincipal(userRole === 'superadmin')
    setCurrentAdminId(parseInt(session.id))
  }, [])

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