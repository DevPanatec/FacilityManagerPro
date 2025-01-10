'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseService } from '@/services/supabaseService'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const response = await supabaseService.auth.getUser()
      if (response.error || !response.data?.user) {
        router.replace('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <div className="mt-4">
            <p className="text-gray-600">
              Bienvenido al panel de administración
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 