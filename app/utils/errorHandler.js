export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error)
  
  if (error.code === 'PGRST301') {
    return 'No tienes permiso para realizar esta acción'
  }
  
  if (error.code === 'PGRST204') {
    return 'No se encontró el recurso solicitado'
  }
  
  return 'Ha ocurrido un error. Por favor, intenta de nuevo.'
} 