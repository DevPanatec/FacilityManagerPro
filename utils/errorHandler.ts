export const errorHandler = {
  logError(context: string, error: unknown) {
    console.error(`Error en ${context}:`, error)
    return error instanceof Error ? error : new Error('Error desconocido')
  }
} 