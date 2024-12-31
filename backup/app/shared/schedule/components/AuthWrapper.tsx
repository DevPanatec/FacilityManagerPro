'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          window.location.href = '/login'
          return
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
} 