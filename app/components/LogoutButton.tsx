'use client'

import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Cookies from 'js-cookie'

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleLogout = async () => {
        try {
            // Establecer cookie de logout
            Cookies.set('logging_out', 'true', { path: '/' })
            
            // Cerrar sesión en Supabase
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            
            // Limpiar cualquier estado local si es necesario
            if (typeof window !== 'undefined') {
                localStorage.clear()
            }
            
            // Redirigir al login usando router.replace para evitar problemas con el historial
            router.replace('/auth/login')
        } catch (error) {
            console.error('Error al cerrar sesión:', error)
            // Eliminar la cookie de logout en caso de error
            Cookies.remove('logging_out', { path: '/' })
        }
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