'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types/database'

export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    showPassword: false
  })
  const supabase = createClientComponentClient<Database>()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      // Login directo con Supabase
      console.log('Intentando login con:', { email })
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('Error en login:', authError)
        toast.error(authError.message || 'Error al iniciar sesión')
        return
      }

      console.log('Login exitoso:', authData)

      if (!authData?.user) {
        toast.error('Credenciales inválidas')
        return
      }

      // Obtener datos del usuario y su organización
      console.log('Buscando datos del usuario:', authData.user.id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          role,
          organization_id
        `)
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('Error al obtener datos del usuario:', userError)
        toast.error('Error al obtener datos del usuario')
        return
      }

      console.log('Datos del usuario:', userData)

      if (!userData) {
        toast.error('Usuario no encontrado')
        return
      }

      // Validar rol y redireccionar según corresponda
      console.log('Rol del usuario:', userData.role)
      if (userData.role === 'superadmin') {
        console.log('Usuario es superadmin, guardando datos...')
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('userId', userData.id)
        console.log('Datos guardados, redirigiendo...')
        window.location.href = '/superadmin/dashboard'
      } else if (userData.role === 'enterprise') {
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('userId', userData.id)
        localStorage.setItem('organizationId', userData.organization_id)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', userData.organization_id)
          .single()
        localStorage.setItem('organizationName', orgData?.name || '')
        window.location.href = '/enterprise/dashboard'
      } else if (userData.role === 'admin') {
        localStorage.setItem('userRole', userData.role)
        localStorage.setItem('userId', userData.id)
        localStorage.setItem('organizationId', userData.organization_id)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', userData.organization_id)
          .single()
        localStorage.setItem('organizationName', orgData?.name || '')
        window.location.href = '/admin/dashboard'
      } else {
        console.log('Rol no autorizado:', userData.role)
        toast.error('Acceso no autorizado')
        await supabase.auth.signOut()
        return
      }

      toast.success('Bienvenido')

    } catch (error) {
      console.error('Error en el proceso de login:', error)
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto my-4 md:my-8 px-4">
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6 md:mb-10">
              <Image
                src="/logo-new.jpg"
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