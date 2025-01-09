import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { supabaseService } from '@/services/supabaseService'

export class BaseService {
  protected supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = supabaseService.db
  }

  protected handleError(error: any): never {
    console.error('Error en servicio:', error)

    // Manejar errores específicos de Supabase
    if (error.code) {
      switch (error.code) {
        case 'PGRST301':
          throw new Error('Error de permisos: No tienes acceso a este recurso')
        case 'P0001':
          throw new Error('Error de validación en la base de datos')
        case '23505':
          throw new Error('El registro ya existe')
        case '23503':
          throw new Error('El registro referenciado no existe')
        default:
          throw new Error(`Error del servidor: ${error.message}`)
      }
    }

    // Si no es un error específico de Supabase
    if (error instanceof Error) {
      throw error
    }

    // Para cualquier otro tipo de error
    throw new Error('Error desconocido en el servicio')
  }

  protected handleResponse<T>(data: T | null, error: any): T {
    if (error) {
      throw this.handleError(error)
    }
    
    if (!data) {
      throw new Error('No se encontraron datos')
    }

    return data
  }
} 