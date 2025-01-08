'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/utils/supabase/client'
import type { Session } from '@supabase/supabase-js'

export default function TestSupabaseClient() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Supabase Client Test</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify({ session }, null, 2)}
      </pre>
    </div>
  )
} 