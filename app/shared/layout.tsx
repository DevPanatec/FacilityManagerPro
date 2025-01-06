'use client'
import { useEffect } from 'react'
import { getSession } from '../utils/auth'
import Navbar from './componentes/navbar'

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const session = getSession()
    
    if (!session) {
      window.location.href = '/auth/login'
      return
    }

    // Verificar si el usuario tiene un rol válido para acceder a rutas compartidas
    const validRoles = ['admin', 'superadmin', 'enterprise']
    if (!validRoles.includes(session.role)) {
      window.location.href = '/auth/login'
      return
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
          {children}
        </div>
      </main>
    </div>
  )
}