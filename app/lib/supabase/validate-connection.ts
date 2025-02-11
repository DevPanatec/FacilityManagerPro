import { createClient } from './client'

export const validateSupabaseConnection = async () => {
  const supabase = createClient()
  
  try {
    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      console.error('Error de conexión:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Verificar la autenticación anónima
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('Error de autenticación:', authError)
      return {
        success: false,
        error: authError.message
      }
    }

    return {
      success: true,
      message: 'Conexión exitosa'
    }
  } catch (error) {
    console.error('Error inesperado:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
} 