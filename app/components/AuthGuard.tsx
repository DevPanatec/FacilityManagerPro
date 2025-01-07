'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/login')
    }
  }, [session, loading, router])

  if (loading) {
    return <div>Cargando...</div>
  }

  return session ? <>{children}</> : null
} 
