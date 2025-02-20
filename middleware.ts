import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/app/lib/supabase/types'
import { validateInput } from './lib/middleware/inputValidation'
import crypto from 'crypto'

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

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/',
  '/about',
  '/contact'
];

// Rutas permitidas por rol
const ROLE_ROUTES: Record<string, string[]> = {
  superadmin: ['/superadmin', '/admin', '/enterprise'],
  admin: ['/admin', '/enterprise'],
  enterprise: ['/enterprise'],
  usuario: ['/user']
};

export function middleware(request: NextRequest) {
  // Construir la política CSP más permisiva temporalmente
  const csp = `
    default-src 'self' https:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' data: blob: https:;
    font-src 'self' data: https:;
    connect-src 'self' https: wss:;
    frame-ancestors 'self';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s{2,}/g, ' ').trim()

  // Clonar los headers de la respuesta
  const response = NextResponse.next()
  const headers = new Headers(response.headers)

  // Agregar los headers de seguridad
  headers.set('Content-Security-Policy', csp)

  // Retornar la respuesta con los nuevos headers
  return new NextResponse(null, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

// Funciones auxiliares
function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(jpg|jpeg|png|gif|ico|svg)$/) !== null
  )
}

function redirectToLogin(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/login', req.url))
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
  if (rolePrefix === userData.role || ROLE_ROUTES[userData.role]?.includes(`/${rolePrefix}`)) {
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

// Configurar las rutas que deben ser manejadas por el middleware
export const config = {
  matcher: '/:path*',
}