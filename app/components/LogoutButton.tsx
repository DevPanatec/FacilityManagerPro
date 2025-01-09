'use client'

import { useRouter } from 'next/navigation'
import { clearSession } from '../../utils/auth/auth'
import Cookies from 'js-cookie'

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = () => {
        // Limpiar sesión del localStorage y cookies
        clearSession()
        Cookies.remove('session', { path: '/' })
        
        // Redirigir al login
        router.push('/auth/login')
    }

    return (
        <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
        >
            Cerrar Sesión
        </button>
    )
} 