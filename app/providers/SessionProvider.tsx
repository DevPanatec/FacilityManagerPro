'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase/client'

const SessionContext = createContext<{
  session: Session | null
  isLoading: boolean
}>({
  session: null,
  isLoading: true
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)

export function useAuth() {
  const { session, isLoading } = useSession()
  const isAuthenticated = !!session
  
  return {
    session,
    isLoading,
    isAuthenticated,
    user: session?.user
  }
} 
