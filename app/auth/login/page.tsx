'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { FaUser, FaLock } from 'react-icons/fa'
import { login } from './actions'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    showPassword: false
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    toast.dismiss()

    try {
      if (!formState.email || !formState.password) {
        toast.error('Please enter both email and password')
        return
      }

      const formData = new FormData()
      formData.append('email', formState.email.trim().toLowerCase())
      formData.append('password', formState.password)

      console.log('Attempting login with:', {
        email: formState.email.trim().toLowerCase(),
        timestamp: new Date().toISOString()
      })

      await login(formData)
      
    } catch (error) {
      console.error('Login error:', error)
      
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      if (message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
      } else if (message.includes('Email not confirmed')) {
        toast.error('Please confirm your email before logging in')
      } else {
        toast.error('An error occurred during login')
      }
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm md:text-base font-medium"
                  disabled={isLoading}
                >
                  {formState.showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 md:py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm md:text-base lg:text-lg font-medium transition-colors duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
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