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