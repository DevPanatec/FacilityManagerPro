'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function TestLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      console.log('Testing login with:', {
        email: credentials.email,
        passwordLength: credentials.password.length
      })

      // First check if we have an existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      
      if (existingSession) {
        console.log('Found existing session, signing out first...')
        await supabase.auth.signOut()
      }

      // Try to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw signInError
      }

      if (!data.user) {
        throw new Error('No user data returned')
      }

      // Get session after login
      const { data: { session } } = await supabase.auth.getSession()

      setResult({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        },
        session: {
          exists: !!session,
          expiresAt: session?.expires_at
        },
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('Login test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Test Login</h2>
      
      <form onSubmit={testLogin} className="space-y-4">
        <div>
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({...prev, email: e.target.value}))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-1">Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error Details:</p>
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