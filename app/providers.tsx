'use client'

import { PropsWithChildren } from 'react'
import { useState, useEffect } from 'react'

export function Providers({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {children}
    </>
  )
} 