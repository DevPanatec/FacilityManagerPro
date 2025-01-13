'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    // Verificar si es admin principal
    const adminPrincipal = localStorage.getItem('adminPrincipal')
    setIsAdminPrincipal(!!adminPrincipal)

    // Obtener el ID del admin actual
    const adminId = localStorage.getItem('adminId')
    setCurrentAdminId(adminId ? parseInt(adminId) : 3) // Por defecto Carlos (ID: 3)

    // Verificar el rol
    const userRole = localStorage.getItem('userRole')
    if (!userRole || userRole !== 'admin') {
      router.push('/auth/login')
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