'use client'

import { useAuth } from '@/providers/SessionProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith('/auth')) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isLoading, pathname])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
} 
