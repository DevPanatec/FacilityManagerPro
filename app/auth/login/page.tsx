'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { AuthError } from '@supabase/supabase-js'

type UserData = {
  role: string;
}

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
        toast.error('Por favor ingresa email y contraseña')
        return
      }

      const email = formState.email.trim().toLowerCase()
      const password = formState.password

      console.log('Intentando autenticar:', { 
        email,
        passwordLength: password.length,
        timestamp: new Date().toISOString()
      })

      // Primero verificar si el usuario existe
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Error de autenticación:', {
          error: signInError,
          email,
          timestamp: new Date().toISOString()
        })

        if (signInError.message?.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos')
        } else if (signInError.message?.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión')
        } else {
          toast.error('Error de autenticación: ' + signInError.message)
        }
        return
      }

      if (!user?.id) {
        console.error('No se pudo obtener la información del usuario')
        toast.error('Error al obtener información del usuario')
        return
      }

      // Obtener rol del usuario
      const { data, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error al obtener rol:', userError)
        toast.error('Error al obtener permisos del usuario')
        return
      }

      const userData = data as UserData
      const role = userData?.role || user.user_metadata?.role || 'usuario'
      
      // Establecer cookies
      document.cookie = `userRole=${role}; path=/; secure; samesite=strict`
      document.cookie = `isAuthenticated=true; path=/; secure; samesite=strict`
      document.cookie = `isSuperAdmin=${role === 'superadmin'}; path=/; secure; samesite=strict`

      // Redirigir según el rol
      let targetPath = '/user/usuario'
      if (role === 'admin' || role === 'superadmin') {
        targetPath = '/admin/dashboard'
      } else if (role === 'enterprise') {
        targetPath = '/enterprise/dashboard'
      }

      console.log('Login exitoso, redirigiendo a:', {
        targetPath,
        role,
        userId: user.id,
        timestamp: new Date().toISOString()
      })

      toast.success('Iniciando sesión...')
      router.replace(targetPath)

    } catch (error: any) {
      console.error('Error inesperado:', error)
      toast.error('Error inesperado al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }, [formState, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto w-24 h-24 rounded-lg shadow-md"
            priority
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative">
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
                required
              />
              <FaUser className="absolute right-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <input
                type={formState.showPassword ? "text" : "password"}
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <FaLock 
                className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
                onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
} 