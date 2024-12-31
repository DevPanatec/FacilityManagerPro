import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://facility-manager-6lfrku13b-panatecs-projects-2fe44854.vercel.app';

export async function middleware(request) {
  // Si ya está en login, permitir
  if (request.nextUrl.pathname === '/auth/login') {
    return NextResponse.next();
  }

  try {
    // Verificar si el usuario está autenticado usando cookies
    const userRole = request.cookies.get('userRole')?.value;
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value;
    const isSuperAdmin = request.cookies.get('isSuperAdmin')?.value;
    
    const redirectToLogin = () => {
      const loginUrl = new URL('/auth/login', BASE_URL);
      return NextResponse.redirect(loginUrl);
    };

    if (!isAuthenticated) {
      return redirectToLogin();
    }

    // Si es SuperAdmin
    if (isSuperAdmin === 'true') {
      // Si intenta acceder a login, redirigir a admin
      if (request.nextUrl.pathname === '/auth/login') {
        return NextResponse.redirect(new URL('/admin/dashboard', BASE_URL));
      }
      // Permitir acceso a rutas admin
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next();
      }
      // Redirigir a admin si intenta acceder a otras rutas
      return NextResponse.redirect(new URL('/admin/dashboard', BASE_URL));
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
    return redirectToLogin();

  } catch (error) {
    console.error('Middleware error:', error);
    return redirectToLogin();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.jpg).*)',
  ]
}; 