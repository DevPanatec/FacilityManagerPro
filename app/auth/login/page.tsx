'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { Database, UserRoleResponse } from '@/types/supabase'
import { AuthError } from '@supabase/supabase-js'

type UserRole = Database['public']['Tables']['users']['Row']['role']

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
    toast.dismiss() // Limpiar toasts anteriores

    try {
      // Paso 1: Autenticación
      toast.loading('Verificando credenciales...')
      
      if (!formState.email || !formState.password) {
        toast.error('Por favor ingresa email y contraseña')
        return
      }

      console.log('Intentando autenticar con:', { email: formState.email })
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formState.email,
        password: formState.password,
      })

      if (authError) {
        // Manejar errores específicos de autenticación
        console.error('Error de autenticación completo:', {
          status: authError.status,
          name: authError.name,
          message: authError.message
        })

        if (authError.status === 400) {
          toast.error('Email o contraseña incorrectos. Por favor verifica tus credenciales.')
          throw new Error('Credenciales inválidas')
        } else if (authError.status === 422) {
          toast.error('El formato del email no es válido')
          throw new Error('Email inválido')
        } else {
          toast.error(`Error de autenticación: ${authError.message}`)
          throw authError
        }
      }

      if (!authData?.user?.id) {
        console.error('Respuesta de autenticación:', authData)
        toast.error('No se pudo obtener la información del usuario')
        throw new Error('Respuesta de autenticación inválida')
      }

      toast.success('Credenciales verificadas')

      // Paso 2: Obtener rol del usuario
      toast.loading('Obteniendo permisos...')
      console.log('Buscando rol para usuario:', authData.user.id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('Error al obtener rol:', userError)
        toast.error('Error al obtener permisos del usuario')
        throw new Error(userError.message)
      }

      if (!userData?.role) {
        console.error('Datos de usuario obtenidos:', userData)
        toast.error('Usuario sin rol asignado')
        throw new Error('No se encontró el rol del usuario')
      }

      const role = userData.role
      console.log('Rol obtenido:', role)
      toast.success('Permisos verificados')

      // Paso 3: Redirigir según el rol
      toast.loading(`Accediendo como ${role}...`)
      
      switch(role) {
        case 'superadmin':
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'enterprise':
          router.push('/enterprise/dashboard')
          break
        case 'usuario':
        default:
          router.push('/user/usuario')
      }
    } catch (error: any) {
      console.error('Error detallado:', {
        message: error.message,
        stack: error.stack,
        error
      })
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