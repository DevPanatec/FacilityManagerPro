import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware: Iniciando verificación para ruta:', pathname);
  console.log('Middleware: URL completa:', request.url);
  console.log('Middleware: Headers:', Object.fromEntries(request.headers));

  // Si ya está en login, permitir
  if (pathname === '/auth/login') {
    console.log('Middleware: Permitiendo acceso a login');
    return NextResponse.next();
  }

  try {
    // Verificar si el usuario está autenticado usando cookies
    const cookies = request.cookies;
    console.log('Middleware: Todas las cookies:', Object.fromEntries(cookies.getAll().map(c => [c.name, c.value])));

    const userRole = cookies.get('userRole')?.value;
    const isAuthenticated = cookies.get('isAuthenticated')?.value;
    const isSuperAdmin = cookies.get('isSuperAdmin')?.value;

    console.log('Middleware: Estado de autenticación:', {
      userRole,
      isAuthenticated,
      isSuperAdmin,
      pathname
    });

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      console.log('Middleware: Usuario no autenticado, redirigiendo a login');
      const loginUrl = new URL('/auth/login', request.url);
      console.log('Middleware: URL de redirección:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }

    // Si es SuperAdmin o Admin
    if (isSuperAdmin === 'true' || userRole === 'admin') {
      console.log('Middleware: Usuario es Admin/SuperAdmin');
      
      // Si intenta acceder a login estando autenticado, redirigir a dashboard
      if (pathname === '/auth/login') {
        console.log('Middleware: Redirigiendo Admin de login a dashboard');
        const dashboardUrl = new URL('/admin/dashboard', request.url);
        console.log('Middleware: URL de redirección:', dashboardUrl.toString());
        return NextResponse.redirect(dashboardUrl);
      }
      
      // Permitir acceso a rutas admin
      if (pathname.startsWith('/admin')) {
        console.log('Middleware: Permitiendo acceso a ruta admin');
        return NextResponse.next();
      }
      
      // Redirigir a admin dashboard para otras rutas
      console.log('Middleware: Redirigiendo Admin a dashboard');
      const dashboardUrl = new URL('/admin/dashboard', request.url);
      console.log('Middleware: URL de redirección:', dashboardUrl.toString());
      return NextResponse.redirect(dashboardUrl);
    }

    console.log('Middleware: Verificando permisos específicos para rol:', userRole);

    // Para usuarios normales
    if (userRole === 'usuario' && pathname.startsWith('/user')) {
      console.log('Middleware: Permitiendo acceso a ruta de usuario normal');
      return NextResponse.next();
    }

    // Para usuarios enterprise
    if (userRole === 'enterprise' && pathname.startsWith('/enterprise')) {
      console.log('Middleware: Permitiendo acceso a ruta enterprise');
      return NextResponse.next();
    }

    // Si no tiene los permisos adecuados, redirigir al login
    console.log('Middleware: Usuario sin permisos adecuados, redirigiendo a login');
    const loginUrl = new URL('/auth/login', request.url);
    console.log('Middleware: URL de redirección final:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);

  } catch (error) {
    console.error('Middleware error detallado:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
    });
    
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