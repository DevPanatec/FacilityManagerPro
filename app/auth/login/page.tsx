'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { login } from './actions'
import { SessionProvider } from '../../providers/SessionProvider'

type UserData = {
  role: string;
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    showPassword: false
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/protected')
    }
  }, [isAuthenticated, router])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    toast.dismiss()

    try {
      if (!formState.email || !formState.password) {
        toast.error('Por favor ingresa email y contraseña')
        return
      }

      const formData = new FormData()
      formData.append('email', formState.email.trim().toLowerCase())
      formData.append('password', formState.password)

      const response = await login(formData)
      
      if (!response.success) {
        throw new Error(response.error || 'Error de autenticación')
      }

      toast.success('Iniciando sesión...')
      router.refresh()

    } catch (error: unknown) {
      console.error('Error de autenticación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado al iniciar sesión'
      
      if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos')
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Por favor confirma tu email antes de iniciar sesión')
      } else {
        toast.error('Error inesperado al iniciar sesión')
      }
    } finally {
      setIsLoading(false)
    }
  }, [formState, router])

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto my-4 md:my-8 px-4">
        {/* ... resto del JSX existente ... */}
      </div>
    </div>
  )
} 
