'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa'
import { BsBuilding } from 'react-icons/bs'

// Cargar el mapa dinámicamente solo en el cliente
const Map = dynamic(() => import('./DynamicMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
})

// Funciones de almacenamiento seguras
const storage = {
  set: (key, value) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value)
        // También establecer cookie
        document.cookie = `${key}=${value}; path=/; max-age=86400; secure; samesite=strict`
      } catch (e) {
        console.error('Error accessing storage:', e)
      }
    }
  },
  remove: (key) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key)
        // También eliminar cookie
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
      } catch (e) {
        console.error('Error accessing storage:', e)
      }
    }
  },
  get: (key) => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key)
      } catch (e) {
        console.error('Error accessing storage:', e)
        return null
      }
    }
    return null
  }
}

const LoginPage = () => {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formState, setFormState] = useState({
        username: '',
        password: '',
        showPassword: false
    })

    useEffect(() => {
        setMounted(true)
        // Limpiar storage al montar
        storage.remove('userRole')
        storage.remove('isAuthenticated')
        storage.remove('isSuperAdmin')
    }, [])

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        if (!mounted) return
        
        setIsLoading(true)

        try {
            if (formState.username === 'admin_principal' && formState.password === 'admin123') {
                storage.set('userRole', 'admin')
                storage.set('isAuthenticated', 'true')
                storage.set('isSuperAdmin', 'true')
                toast.success('Bienvenido Administrador Principal')
                router.replace('/admin/dashboard')
                return
            }

            if (formState.username === 'admin' && formState.password === '123456') {
                storage.set('userRole', 'admin')
                storage.set('isAuthenticated', 'true')
                storage.set('isSuperAdmin', 'false')
                toast.success('Bienvenido Administrador')
                router.replace('/admin/dashboard')
                return
            }

            if (formState.username === 'enterprise' && formState.password === '123456') {
                storage.set('userRole', 'enterprise')
                storage.set('isAuthenticated', 'true')
                toast.success('Bienvenido Enterprise')
                router.replace('/enterprise/dashboard')
                return
            }

            if (formState.username === 'usuario' && formState.password === '123456') {
                storage.set('userRole', 'usuario')
                storage.set('isAuthenticated', 'true')
                toast.success('Bienvenido Usuario')
                router.replace('/user/usuario')
                return
            }

            toast.error('Credenciales incorrectas', {
                style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    padding: '16px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                },
                icon: '❌',
                position: 'top-center',
                duration: 3000,
            })
        } catch (error) {
            console.error('Error en login:', error)
            toast.error('Error al iniciar sesión', {
                style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    padding: '16px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                },
                icon: '⚠️',
                position: 'top-center',
                duration: 3000,
            })
        } finally {
            setIsLoading(false)
        }
    }, [formState, router, mounted])

    if (!mounted) return null

    return (
        <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
            {/* Ondas decorativas mejoradas */}
            <div className="absolute inset-0 overflow-hidden">
                <svg className="absolute bottom-0 w-full h-[80vh] opacity-15" 
                     viewBox="0 0 1440 320" 
                     preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.4)' }} />
                            <stop offset="50%" style={{ stopColor: 'rgba(255,255,255,0.2)' }} />
                            <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.4)' }} />
                        </linearGradient>
                    </defs>
                    <path fill="url(#gradient)" 
                          d="M0,160L48,165.3C96,171,192,181,288,197.3C384,213,480,235,576,218.7C672,203,768,149,864,149.3C960,149,1056,203,1152,202.7C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                          className="transition-all duration-300 ease-in-out hover:opacity-75">
                    </path>
                </svg>
            </div>

            {/* Contenido principal */}
            <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto my-4 md:my-8 px-4 animate-fadeIn">
                {/* Panel azul de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 to-blue-700/95 rounded-2xl md:rounded-3xl shadow-2xl backdrop-blur-sm">
                    <div className="p-6 md:p-8 lg:p-12 text-white">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 md:mb-4 tracking-tight">
                            Sistema de gestión y control de servicios
                        </h1>
                        <div className="flex items-center text-white/90 space-x-2">
                            <BsBuilding className="w-4 h-4 lg:w-5 lg:h-5" />
                            <span className="text-sm lg:text-base font-light">Gestión profesional de servicios</span>
                        </div>
                    </div>
                </div>

                {/* Panel celeste claro degradado */}
                <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl md:rounded-3xl shadow-lg opacity-95">
                </div>

                {/* Panel blanco principal */}
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 transition-all duration-300">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-6 md:mb-10 transform transition-transform duration-300 hover:scale-105">
                            <Image
                                src="/logo.jpg"
                                alt="Logo"
                                width={100}
                                height={100}
                                className="mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-2xl shadow-lg"
                                priority
                            />
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-700 mb-2 md:mb-3 text-center tracking-tight">
                            Bienvenido
                        </h2>
                        <p className="text-gray-700 text-base md:text-lg lg:text-xl text-center mb-6 md:mb-8 lg:mb-10 font-medium">
                            Ingresa tus credenciales para continuar
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 lg:space-y-6">
                            <div className="relative group">
                                <FaUser className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-500 text-lg transition-colors group-hover:text-blue-600" />
                                <input
                                    type="text"
                                    value={formState.username}
                                    onChange={(e) => setFormState(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 lg:py-4 border border-gray-200 rounded-xl text-sm md:text-base lg:text-lg
                                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50
                                             transition-all duration-200 bg-white/75 backdrop-blur-sm
                                             hover:border-blue-400"
                                    placeholder="Ingresa tu usuario"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <FaLock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-blue-500 text-lg transition-colors group-hover:text-blue-600" />
                                <input
                                    type={formState.showPassword ? 'text' : 'password'}
                                    value={formState.password}
                                    onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full pl-10 md:pl-12 pr-24 py-2.5 md:py-3 lg:py-4 border border-gray-200 rounded-xl text-sm md:text-base lg:text-lg
                                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50
                                             transition-all duration-200 bg-white/75 backdrop-blur-sm
                                             hover:border-blue-400"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-blue-600 text-sm md:text-base font-medium
                                             bg-blue-50 px-3 py-1 rounded-lg
                                             hover:bg-blue-100 hover:text-blue-700 
                                             transition-all duration-200"
                                >
                                    {formState.showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 md:py-4 lg:py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-base md:text-lg lg:text-xl font-semibold
                                         hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02]
                                         focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                                         disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed
                                         shadow-lg hover:shadow-xl flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Cargando...
                                    </>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 md:mt-8 text-center">
                            <a href="#" className="text-blue-500 text-xs md:text-sm hover:text-blue-700 hover:underline transition-colors duration-200">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full py-3 md:py-4 text-center mt-auto">
                <p className="text-xs md:text-sm font-light text-white/90 tracking-wide">
                    <span className="font-medium">FacilityManager</span>
                    <span className="font-light">Pro</span>
                    <span className="mx-1">©</span>
                    <span>2024</span>
                </p>
            </footer>
        </div>
    )
}

export default LoginPage

