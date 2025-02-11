'use client'

import { PropsWithChildren } from 'react'
import { useState, useEffect } from 'react'
import SupabaseProvider from './lib/supabase/supabase-provider'

export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SupabaseProvider>
      {children}
    </SupabaseProvider>
  )
} 