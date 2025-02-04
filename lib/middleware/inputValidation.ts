import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Caracteres peligrosos que podrían indicar SQL injection
const SUSPICIOUS_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,          // Comillas simples y comentarios
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Patrones de igualdad seguidos de comillas o comentarios
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // Variantes de 'OR'
  /((\%27)|(\'))union/i,                      // UNION attacks
  /exec(\s|\+)+(s|x)p\w+/i,                   // Ejecución de stored procedures
  /INFORMATION_SCHEMA|SCHEMA_NAME/i,           // Intentos de obtener metadata
]

// Tipos de contenido que deberían ser validados
const VALIDATE_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data'
]

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Eliminar caracteres peligrosos
    return value
      .replace(/[;'"\\]|--/g, '') // Eliminar caracteres SQL peligrosos
      .replace(/\s+/g, ' ')       // Normalizar espacios
      .trim()
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc, key) => ({
      ...acc,
      [key]: sanitizeValue(value[key])
    }), {})
  }
  
  return value
}

function hasSuspiciousPatterns(value: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(value))
}

export async function validateInput(request: NextRequest) {
  try {
    // Verificar el tipo de contenido
    const contentType = request.headers.get('content-type') || ''
    if (!VALIDATE_CONTENT_TYPES.some(type => contentType.includes(type))) {
      return NextResponse.next()
    }

    // Clonar el request para no modificar el original
    const clonedRequest = request.clone()
    
    // Obtener el body si existe
    let body = {}
    if (contentType.includes('application/json')) {
      body = await clonedRequest.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = Object.fromEntries(await clonedRequest.formData())
    }

    // Validar cada valor en el body
    const validateValues = (obj: any): boolean => {
      for (const key in obj) {
        const value = obj[key]
        if (typeof value === 'string' && hasSuspiciousPatterns(value)) {
          return false
        }
        if (typeof value === 'object' && value !== null) {
          if (!validateValues(value)) return false
        }
      }
      return true
    }

    // Si se encuentran patrones sospechosos, rechazar la petición
    if (!validateValues(body)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Potential malicious content detected'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Sanitizar los datos
    const sanitizedBody = sanitizeValue(body)

    // Crear un nuevo request con los datos sanitizados
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(sanitizedBody)
    })

    return NextResponse.next({
      request: newRequest
    })

  } catch (error) {
    console.error('Error in input validation middleware:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid request format'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 