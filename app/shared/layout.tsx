'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from './componentes/navbar'
import ChatWidget from './componentes/ChatWidget'

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (!role) {
      router.push('/auth/login')
      return
    }
    setUserRole(role)
  }, [router])

  // Verificar que el usuario tenga acceso a las rutas compartidas
  useEffect(() => {
    if (!userRole) return

    const allowedRoles = ['admin', 'enterprise']
    if (!allowedRoles.includes(userRole)) {
      router.push('/auth/login')
    }
  }, [userRole, router])

  if (!userRole) {
    return null // No renderizar nada mientras verificamos el rol
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar isEnterprise={userRole === 'enterprise'} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
      <ChatWidget 
        isAdmin={userRole === 'admin'}
        isAdminPrincipal={userRole === 'admin'}
      />
    </div>
  )
}