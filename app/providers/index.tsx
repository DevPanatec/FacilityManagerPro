'use client'

import { SessionProvider } from './SessionProvider'
// ... otros providers

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
} 
