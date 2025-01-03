'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type UserRole = Database['public']['Tables']['users']['Row']['role']

export default function LoginForm() {
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
      toast.loading('Verificando credenciales...')
      
      if (!formState.email || !formState.password) {
        toast.error('Por favor ingresa email y contraseña')
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formState.email.trim().toLowerCase(),
        password: formState.password,
      })

      if (authError) {
        let errorMessage = 'Error de autenticación'
        
        if (authError.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (authError.message?.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión'
        }
        
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (!authData?.user?.id) {
        toast.error('Error al obtener información del usuario')
        throw new Error('Respuesta de autenticación inválida')
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!userData || userError) {
        const userRole = authData.user.user_metadata?.role || 'usuario';

        try {
          await supabase
            .from('users')
            .upsert({
              id: authData.user.id,
              email: authData.user.email,
              role: userRole,
              first_name: authData.user.user_metadata?.first_name,
              last_name: authData.user.user_metadata?.last_name
            })
        } catch (updateError) {
          console.error('Error al actualizar usuario:', updateError);
        }

        try {
          await supabase
            .from('activity_logs')
            .insert({
              id: crypto.randomUUID(),
              user_id: authData.user.id,
              action: 'LOGIN',
              description: 'User logged in successfully (metadata)',
              metadata: {
                role: userRole,
                email: authData.user.email,
                timestamp: new Date().toISOString()
              }
            });
        } catch (logError) {
          console.error('Error al registrar actividad:', logError);
        }

        let targetPath = '';
        switch(userRole) {
          case 'superadmin':
          case 'admin':
            targetPath = '/admin/dashboard';
            break;
          case 'enterprise':
            targetPath = '/enterprise/dashboard';
            break;
          default:
            targetPath = '/user/usuario';
        }

        toast.success('Iniciando sesión...')
        router.replace(targetPath);
        return;
      }

      if (!userData?.role) {
        toast.error('Usuario sin rol asignado')
        throw new Error('No se encontró el rol del usuario')
      }

      try {
        await supabase
          .from('activity_logs')
          .insert({
            id: crypto.randomUUID(),
            user_id: authData.user.id,
            action: 'LOGIN',
            description: 'User logged in successfully',
            metadata: {
              role: userData.role,
              email: authData.user.email,
              timestamp: new Date().toISOString()
            }
          });
      } catch (logError) {
        console.error('Error al registrar actividad:', logError);
      }

      toast.success('Iniciando sesión...')
      
      let targetPath = '';
      switch(userData.role) {
        case 'superadmin':
        case 'admin':
          targetPath = '/admin/dashboard';
          break;
        case 'enterprise':
          targetPath = '/enterprise/dashboard';
          break;
        default:
          targetPath = '/user/usuario';
      }
      
      router.replace(targetPath);

    } catch (error: any) {
      console.error('Error:', error.message)
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