'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { BsBuilding } from 'react-icons/bs'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    username: '',
    password: '',
    showPassword: false
  })

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formState.username === 'admin_principal' && formState.password === 'admin123') {
        localStorage.setItem('userRole', 'admin')
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('isSuperAdmin', 'true')
        document.cookie = 'userRole=admin; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isAuthenticated=true; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isSuperAdmin=true; path=/; max-age=86400; secure; samesite=strict'
        toast.success('Bienvenido Administrador Principal')
        router.push('/admin/dashboard')
        return
      }

      if (formState.username === 'admin' && formState.password === '123456') {
        localStorage.setItem('userRole', 'admin')
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('isSuperAdmin', 'false')
        document.cookie = 'userRole=admin; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isAuthenticated=true; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isSuperAdmin=false; path=/; max-age=86400; secure; samesite=strict'
        toast.success('Bienvenido Administrador')
        router.push('/admin/dashboard')
        return
      }

      if (formState.username === 'enterprise' && formState.password === '123456') {
        localStorage.setItem('userRole', 'enterprise')
        localStorage.setItem('isAuthenticated', 'true')
        document.cookie = 'userRole=enterprise; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isAuthenticated=true; path=/; max-age=86400; secure; samesite=strict'
        toast.success('Bienvenido Enterprise')
        router.push('/enterprise/dashboard')
        return
      }

      if (formState.username === 'usuario' && formState.password === '123456') {
        localStorage.setItem('userRole', 'usuario')
        localStorage.setItem('isAuthenticated', 'true')
        document.cookie = 'userRole=usuario; path=/; max-age=86400; secure; samesite=strict'
        document.cookie = 'isAuthenticated=true; path=/; max-age=86400; secure; samesite=strict'
        toast.success('Bienvenido Usuario')
        router.push('/user/usuario')
        return
      }

      toast.error('Credenciales incorrectas')
    } catch (error) {
      console.error('Error en login:', error)
      toast.error('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }, [formState, router])

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      {/* Panel principal */}
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
                  type="text"
                  value={formState.username}
                  onChange={(e) => setFormState(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-4 border border-gray-200 rounded-xl text-sm md:text-base lg:text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                  placeholder="Ingresa tu usuario"
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
                className="w-full py-3 md:py-4 lg:py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-base md:text-lg lg:text-xl font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

