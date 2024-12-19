'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole || userRole !== 'usuario') {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Panel de Usuario
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aquí puedes agregar las tarjetas o contenido del usuario */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Bienvenido</h2>
          <p className="text-gray-600">
            Has iniciado sesión correctamente como usuario.
          </p>
        </div>
      </div>
    </div>
  )
} 