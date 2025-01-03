import { NextResponse } from 'next/server';

export function middleware(request) {
  console.log('Middleware: Verificando ruta:', request.nextUrl.pathname);

  // Si ya está en login, permitir
  if (request.nextUrl.pathname === '/auth/login') {
    console.log('Middleware: Permitiendo acceso a login');
    return NextResponse.next();
  }

  try {
    // Verificar si el usuario está autenticado usando cookies
    const userRole = request.cookies.get('userRole')?.value;
    const isAuthenticated = request.cookies.get('isAuthenticated')?.value;
    const isSuperAdmin = request.cookies.get('isSuperAdmin')?.value;

    console.log('Middleware: Estado de autenticación:', {
      userRole,
      isAuthenticated,
      isSuperAdmin,
    });

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      console.log('Middleware: Usuario no autenticado, redirigiendo a login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Si es SuperAdmin
    if (isSuperAdmin === 'true') {
      console.log('Middleware: Usuario es SuperAdmin');
      // Si intenta acceder a login, redirigir a admin
      if (request.nextUrl.pathname === '/auth/login') {
        console.log('Middleware: Redirigiendo SuperAdmin de login a dashboard');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      // Permitir acceso a rutas admin
      if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('Middleware: Permitiendo acceso a ruta admin');
        return NextResponse.next();
      }
      // Redirigir a admin si intenta acceder a otras rutas
      console.log('Middleware: Redirigiendo SuperAdmin a dashboard admin');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    console.log('Middleware: Verificando permisos para rol:', userRole);

    // Para usuarios normales
    if (userRole === 'usuario' && request.nextUrl.pathname.startsWith('/user')) {
      console.log('Middleware: Permitiendo acceso a ruta de usuario normal');
      return NextResponse.next();
    }

    // Para usuarios enterprise
    if (userRole === 'enterprise' && request.nextUrl.pathname.startsWith('/enterprise')) {
      console.log('Middleware: Permitiendo acceso a ruta enterprise');
      return NextResponse.next();
    }

    // Para administradores normales
    if (userRole === 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
      console.log('Middleware: Permitiendo acceso a ruta admin');
      return NextResponse.next();
    }

    // Si no tiene los permisos adecuados, redirigir al login
    console.log('Middleware: Usuario sin permisos adecuados, redirigiendo a login');
    return NextResponse.redirect(new URL('/auth/login', request.url));

  } catch (error) {
    console.error('Middleware error:', error);
    // Limpiar cookies en caso de error
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('userRole');
    response.cookies.delete('isAuthenticated');
    response.cookies.delete('isSuperAdmin');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpg|assets).*)',
  ],
}; 