import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'
import { validateInput } from './lib/middleware/inputValidation'

// Generar nonce para CSP
const generateNonce = () => {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

// Content Security Policy
const getCSP = (nonce: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const scriptSrc = isDevelopment
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https:`

  return `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.githubusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()
}

export async function middleware(req: NextRequest) {
  // 1. Crear respuesta inicial y cliente de Supabase
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  const nonce = generateNonce()

  try {
    // 2. Permitir acceso a rutas públicas y assets
    if (isPublicRoute(req.nextUrl.pathname)) {
      return addSecurityHeaders(res, nonce)
    }

    // 3. Validar input para rutas API
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const validationResponse = await validateInput(req)
      if (validationResponse.status !== 200) {
        return validationResponse
      }
    }

    // 4. Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return redirectToLogin(req)
    }

    // 5. Verificar rol y permisos
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return redirectToLogin(req)
    }

    // 6. Validar acceso a rutas según rol
    const response = await validateRouteAccess(req, userData, res)
    
    // 7. Añadir headers de seguridad y datos de usuario
    return addSecurityHeaders(response, nonce, userData)

  } catch (error) {
    console.error('Error en middleware:', error)
    return redirectToLogin(req)
  }
}

// Funciones auxiliares
function isPublicRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next') ||
    pathname === '/' ||
    pathname.match(/\.(jpg|jpeg|png|gif|ico|svg)$/) !== null
  )
}

function redirectToLogin(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/auth/login', req.url))
}

async function validateRouteAccess(
  req: NextRequest,
  userData: { role: string; id: string },
  res: NextResponse
): Promise<NextResponse> {
  const response = NextResponse.next()
  
  // Configurar headers con datos de usuario
  response.headers.set('x-user-role', userData.role)
  response.headers.set('x-user-id', userData.id)

  // Verificar rutas compartidas
  if (req.nextUrl.pathname.startsWith('/shared')) {
    const allowedRoles = ['superadmin', 'admin', 'enterprise']
    if (allowedRoles.includes(userData.role)) {
      return response
    }
    return NextResponse.redirect(new URL(`/${userData.role}/dashboard`, req.url))
  }

  // Verificar rutas específicas por rol
  const rolePrefix = req.nextUrl.pathname.split('/')[1]
  if (rolePrefix === userData.role) {
    return response
  }

  // Redirigir a dashboard del rol correspondiente
  return NextResponse.redirect(new URL(`/${userData.role}/dashboard`, req.url))
}

function addSecurityHeaders(
  res: NextResponse,
  nonce: string,
  userData?: { role: string; id: string }
): NextResponse {
  // Headers básicos de seguridad
  res.headers.set('Content-Security-Policy', getCSP(nonce))
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('X-DNS-Prefetch-Control', 'on')
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Añadir datos de usuario si existen
  if (userData) {
    res.headers.set('x-user-role', userData.role)
    res.headers.set('x-user-id', userData.id)
  }

  return res
}

export const config = {
  matcher: [
    // Rutas protegidas
    '/api/:path*',
    '/admin/:path*',
    '/enterprise/:path*',
    '/manager/:path*',
    '/user/:path*',
    '/shared/:path*',
    '/dashboard/:path*'
  ],
}