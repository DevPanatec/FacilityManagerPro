'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión activa
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('session='));

    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        if (sessionData.role) {
          // Si hay sesión, redirigir según el rol
          if (['admin', 'superadmin'].includes(sessionData.role)) {
            router.replace('/admin/dashboard');
          } else if (sessionData.role === 'enterprise') {
            router.replace('/enterprise/dashboard');
          } else {
            router.replace('/user/dashboard');
          }
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        router.replace('/auth/login');
      }
    } else {
      // Si no hay sesión, redirigir al login
      router.replace('/auth/login');
    }
  }, [router]);

  // Mostrar un estado de carga mientras se verifica la sesión
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4 text-xl font-semibold">Cargando...</p>
      </div>
    </div>
  )
}
