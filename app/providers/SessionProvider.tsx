'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'

interface SessionContextValue {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
})

export function useSession() {
  return useContext(SessionContext)
}

export default function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSession(initialSession)
    setLoading(false)
  }, [initialSession])

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  )
} 
