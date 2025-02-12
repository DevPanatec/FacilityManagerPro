import { supabaseService } from '@/services/supabaseService'

export const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('session')
    localStorage.removeItem('user')
  }
}

export const getSession = async () => {
  try {
    const { data: authData, error } = await supabaseService.auth.getUser()
    if (error) throw error
    return authData?.user || null
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    return null
  }
}

export const isAuthenticated = async () => {
  const user = await getSession()
  return !!user
}

export const logout = async () => {
  try {
    await supabaseService.auth.signOut()
    clearSession()
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    throw error
  }
} 