'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { login } from './actions'
import type { AuthResponse } from '../../../types/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    showPassword: false
  })

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    toast.dismiss()

    try {
      if (!formState.email || !formState.password) {
        toast.error('Please enter email and password')
        return
      }

      const formData = new FormData()
      formData.append('email', formState.email.trim().toLowerCase())
      formData.append('password', formState.password)

      const response = await login(formData)
      
      if (response.error) {
        toast.error(response.error.message)
        return
      }

      toast.success('Login successful')
      router.refresh()
      router.push('/dashboard')

    } catch (error: unknown) {
      console.error('Authentication error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [formState, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-gray-400" />
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                type={formState.showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
