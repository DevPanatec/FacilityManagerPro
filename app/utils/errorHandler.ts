import { NextResponse } from 'next/server'

// Tipos de error personalizados
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Manejador de errores centralizado
export const errorHandler = {
  handle(error: Error) {
    console.error(`[${new Date().toISOString()}] Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    })

    // Determinar el tipo de error y respuesta apropiada
    switch(error.name) {
      case 'AuthError':
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )

      case 'ValidationError':
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )

      case 'DatabaseError':
        return NextResponse.json(
          { error: 'Error en la base de datos' },
          { status: 500 }
        )

      default:
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        )
    }
  },

  // Helper para errores de autenticación
  handleAuth(message = 'No autorizado') {
    return this.handle(new AuthError(message))
  },

  // Helper para errores de validación
  handleValidation(message: string) {
    return this.handle(new ValidationError(message))
  },

  // Helper para errores de base de datos
  handleDatabase(error: any) {
    console.error('Database Error:', error)
    return this.handle(new DatabaseError(error.message))
  },

  // Helper para logging
  logError(context: string, error: any) {
    console.error(`[${context}] Error:`, {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    )
  }

  if (error instanceof Error) {
    // Manejar errores específicos de Supabase o del sistema
    if (error.message.includes('No autorizado') || error.message.includes('not authorized')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    if (error.message.includes('not found') || error.message.includes('no encontrado')) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      )
    }

    // Error genérico pero con mensaje
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Error completamente desconocido
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  )
}

export const throwError = (message: string, status: number = 500, code?: string) => {
  throw new AppError(message, status, code)
}

// Helper para validar y extraer el ID de usuario del token
export const validateAuthAndGetUserId = async (supabase: any) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    throw new AppError('Error de autenticación', 401)
  }
  
  if (!user) {
    throw new AppError('No autorizado', 403)
  }

  return user.id
}

// Helper para validar y extraer la organización del usuario
export const validateAndGetUserOrg = async (supabase: any) => {
  const userId = await validateAuthAndGetUserId(supabase)
  
  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (userError) {
    throw new AppError('Error al obtener perfil de usuario', 500)
  }

  if (!userProfile?.organization_id) {
    throw new AppError('Usuario sin organización asignada', 400)
  }

  return {
    userId,
    organizationId: userProfile.organization_id,
    role: userProfile.role
  }
} 