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
        timestamp: new Date().toISOString(),
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSymbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      })

      // Verificar la configuración de Supabase
      console.log('Configuración Supabase:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        supabaseInstance: !!supabase
      })

      try {
        console.log('Iniciando proceso de signInWithPassword...')
        // Primero verificar si el usuario existe
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          console.error('Error de autenticación completo:', {
            error: signInError,
            errorMessage: signInError.message,
            errorStatus: signInError.status,
            errorCode: signInError.code,
            errorName: signInError.name,
            email,
            timestamp: new Date().toISOString(),
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseInitialized: !!supabase
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
      }

    } catch (error: any) {
      console.error('Error inesperado:', error)
      toast.error('Error inesperado al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }, [formState, router])

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto my-4 md:my-8 px-4">
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6 md:mb-10">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={100}
                height={100}
                className="mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-2xl shadow-lg"
                priority
              />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-700 mb-2 md:mb-3 text-center">
              Bienvenido
            </h2>
            <p className="text-gray-700 text-base md:text-lg lg:text-xl text-center mb-6 md:mb-8 lg:mb-10 font-medium">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 lg:space-y-6">
              <div className="relative">
                <FaUser className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-500 text-lg" />
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-4 border border-gray-200 rounded-xl text-sm md:text-base lg:text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                  placeholder="Ingresa tu correo"
                  required
                />
              </div>

              <div className="relative">
                <FaLock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-500 text-lg" />
                <input
                  type={formState.showPassword ? 'text' : 'password'}
                  value={formState.password}
                  onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 md:pl-12 pr-24 py-2.5 md:py-3 lg:py-4 border border-gray-200 rounded-xl text-sm md:text-base lg:text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm md:text-base font-medium"
                >
                  {formState.showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm md:text-base lg:text-lg font-medium transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 