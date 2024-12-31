import { NextResponse } from 'next/server';

export function middleware(request) {
  // Si ya está en login, permitir
  if (request.nextUrl.pathname === '/auth/login') {
    return NextResponse.next();
  }

  try {
    // Verificar si el usuario está autenticado usando cookies
    const userRole = request.cookies.get('userRole')?.value;
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value;
    const isSuperAdmin = request.cookies.get('isSuperAdmin')?.value;
    
    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Si es SuperAdmin
    if (isSuperAdmin === 'true') {
      // Si intenta acceder a login, redirigir a admin
      if (request.nextUrl.pathname === '/auth/login') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      // Permitir acceso a rutas admin
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next();
      }
      // Redirigir a admin si intenta acceder a otras rutas
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Para usuarios normales
    if (userRole === 'usuario' && request.nextUrl.pathname.startsWith('/user')) {
      return NextResponse.next();
    }

    // Para usuarios enterprise
    if (userRole === 'enterprise' && request.nextUrl.pathname.startsWith('/enterprise')) {
      return NextResponse.next();
    }

    // Para administradores normales
    if (userRole === 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    // Si no tiene los permisos adecuados, redirigir al login
    return NextResponse.redirect(new URL('/auth/login', request.url));

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets, images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.jpg|vercel.svg|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.svg).*)',
  ],
}; 