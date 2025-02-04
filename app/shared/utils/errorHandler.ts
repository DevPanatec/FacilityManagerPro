import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

interface ErrorResponse {
  message: string;
  code: string;
  status: number;
}

interface ErrorLogData {
  error: Error;
  context?: Record<string, any>;
  user?: {
    id: string;
    organization_id: string;
  };
}

// Códigos de error conocidos
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

// Mapeo de códigos de error a mensajes amigables para el usuario
const userFriendlyMessages: Record<string, string> = {
  [ErrorCodes.VALIDATION_ERROR]: 'Los datos proporcionados no son válidos',
  [ErrorCodes.UNAUTHORIZED]: 'No estás autorizado para realizar esta acción',
  [ErrorCodes.FORBIDDEN]: 'No tienes permisos para realizar esta acción',
  [ErrorCodes.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
  [ErrorCodes.INTERNAL_ERROR]: 'Ha ocurrido un error interno',
  [ErrorCodes.FILE_UPLOAD_ERROR]: 'Error al subir el archivo',
  [ErrorCodes.DATABASE_ERROR]: 'Error en la base de datos'
};

// Función para sanitizar datos sensibles
function sanitizeErrorData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeErrorData(sanitized[key]);
    }
  });

  return sanitized;
}

// Función para registrar errores de manera segura
export async function logError({ error, context = {}, user }: ErrorLogData): Promise<void> {
  try {
    const supabase = createClientComponentClient<Database>();
    const sanitizedContext = sanitizeErrorData(context);
    
    // Crear el registro de error
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert([{
        organization_id: user?.organization_id,
        user_id: user?.id,
        error_code: error.name,
        error_message: error.message,
        error_stack: error.stack,
        context: sanitizedContext
      }]);

    if (insertError) {
      // Si falla el registro en la base de datos, al menos lo registramos en la consola
      console.error('Error inserting error log:', insertError);
      console.error('Original error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context: sanitizedContext,
        user
      });
    }
  } catch (loggingError) {
    // Si falla el logging, al menos intentamos registrar en la consola
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', error);
  }
}

// Función principal para manejar errores
export function handleError(error: any, context?: Record<string, any>): ErrorResponse {
  let errorResponse: ErrorResponse;

  // Determinar el tipo de error y crear una respuesta apropiada
  if (error.code === '23505') { // Error de uniqueness en PostgreSQL
    errorResponse = {
      message: 'Ya existe un registro con estos datos',
      code: ErrorCodes.DATABASE_ERROR,
      status: 409
    };
  } else if (error.code === '42P01') { // Tabla no existe en PostgreSQL
    errorResponse = {
      message: 'Error en la base de datos',
      code: ErrorCodes.DATABASE_ERROR,
      status: 500
    };
  } else if (error.message.includes('validation')) {
    errorResponse = {
      message: error.message,
      code: ErrorCodes.VALIDATION_ERROR,
      status: 400
    };
  } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    errorResponse = {
      message: userFriendlyMessages[ErrorCodes.FORBIDDEN],
      code: ErrorCodes.FORBIDDEN,
      status: 403
    };
  } else {
    // Error genérico
    errorResponse = {
      message: userFriendlyMessages[ErrorCodes.INTERNAL_ERROR],
      code: ErrorCodes.INTERNAL_ERROR,
      status: 500
    };
  }

  // Registrar el error
  logError({ error, context });

  return errorResponse;
}

// Función para manejar errores en componentes
export function handleComponentError(error: Error, context?: Record<string, any>): string {
  logError({ error, context });
  
  // Devolver un mensaje amigable para el usuario
  if (error.message in userFriendlyMessages) {
    return userFriendlyMessages[error.message];
  }
  
  return 'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.';
}

// Función para manejar errores en API routes
export function handleApiError(error: any, context?: Record<string, any>): Response {
  const errorResponse = handleError(error, context);
  
  return new Response(
    JSON.stringify({
      error: errorResponse.message,
      code: errorResponse.code
    }),
    {
      status: errorResponse.status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 