'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function TestSupabase() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = await createClient()
      
      // Test 1: Basic Connection & Auth Status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // Test 2: Public Schema Access (simplified query)
      const { data: publicData, error: publicError } = await supabase
        .from('hospitals')
        .select('id, name')
        .limit(1)

      if (publicError) {
        console.error('Public data error:', publicError)
      }

      // Test 3: Auth Status
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('User error:', userError)
      }

      setResult({
        connection: 'Success',
        authStatus: user ? 'Authenticated' : 'Not Authenticated',
        publicAccess: publicData ? 'Success' : 'Failed',
        timestamp: new Date().toISOString(),
        details: {
          hasUser: !!user,
          hasSession: !!session,
          publicDataExists: !!publicData,
          publicError: publicError?.message,
          sessionError: sessionError?.message,
          userError: userError?.message
        }
      })
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Supabase Connection Test</h2>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 