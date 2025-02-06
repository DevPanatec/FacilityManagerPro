import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export interface User {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
  organization_id: string
  avatar_url?: string | null
  first_name?: string | null
  last_name?: string | null
  status?: 'active' | 'inactive' | 'pending'
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session?.user) {
          setUser(null)
          return
        }

        // Get user details including role and organization
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, organization_id, avatar_url, first_name, last_name, status')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        setUser(userData as User)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, error }
} 