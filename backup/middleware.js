import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware: Iniciando verificación para ruta:', pathname);
  console.log('Middleware: URL completa:', request.url);

  // Función helper para crear redirecciones
  const createRedirect = (path) => {
    const url = new URL(path, request.url);
    console.log('Creando redirección a:', url.toString());
    return NextResponse.redirect(url);
  };

  // Si ya está en login, permitir
  if (pathname === '/auth/login') {
    console.log('Middleware: Permitiendo acceso a login');
    return NextResponse.next();
  }

  try {
    // Verificar si el usuario está autenticado usando cookies
    const cookies = request.cookies;
    const cookieValues = Object.fromEntries(cookies.getAll().map(c => [c.name, c.value]));
    console.log('Middleware: Todas las cookies:', cookieValues);

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
    if (!isAuthenticated || !userRole) {
      console.log('Middleware: Usuario no autenticado o sin rol, redirigiendo a login');
      const response = createRedirect('/auth/login');
      // Limpiar cookies por seguridad
      response.cookies.delete('userRole');
      response.cookies.delete('isAuthenticated');
      response.cookies.delete('isSuperAdmin');
      return response;
    }

    // Si es SuperAdmin o Admin
    if (isSuperAdmin === 'true' || userRole === 'admin') {
      console.log('Middleware: Usuario es Admin/SuperAdmin');
      
      // Si intenta acceder a login estando autenticado, redirigir a dashboard
      if (pathname === '/auth/login') {
        console.log('Middleware: Redirigiendo Admin de login a dashboard');
        return createRedirect('/admin/dashboard');
      }
      
      // Permitir acceso a rutas admin
      if (pathname.startsWith('/admin')) {
        console.log('Middleware: Permitiendo acceso a ruta admin');
        const response = NextResponse.next();
        // Asegurar que las cookies persistan
        response.cookies.set('userRole', userRole, { path: '/' });
        response.cookies.set('isAuthenticated', 'true', { path: '/' });
        response.cookies.set('isSuperAdmin', isSuperAdmin, { path: '/' });
        return response;
      }
      
      // Redirigir a admin dashboard para otras rutas
      console.log('Middleware: Redirigiendo Admin a dashboard');
      return createRedirect('/admin/dashboard');
    }

    console.log('Middleware: Verificando permisos específicos para rol:', userRole);

    // Para usuarios normales
    if (userRole === 'usuario' && pathname.startsWith('/user')) {
      console.log('Middleware: Permitiendo acceso a ruta de usuario normal');
      const response = NextResponse.next();
      // Asegurar que las cookies persistan
      response.cookies.set('userRole', userRole, { path: '/' });
      response.cookies.set('isAuthenticated', 'true', { path: '/' });
      response.cookies.set('isSuperAdmin', 'false', { path: '/' });
      return response;
    }

    // Para usuarios enterprise
    if (userRole === 'enterprise' && pathname.startsWith('/enterprise')) {
      console.log('Middleware: Permitiendo acceso a ruta enterprise');
      const response = NextResponse.next();
      // Asegurar que las cookies persistan
      response.cookies.set('userRole', userRole, { path: '/' });
      response.cookies.set('isAuthenticated', 'true', { path: '/' });
      response.cookies.set('isSuperAdmin', 'false', { path: '/' });
      return response;
    }

    // Si no tiene los permisos adecuados, redirigir al login
    console.log('Middleware: Usuario sin permisos adecuados, redirigiendo a login');
    const response = createRedirect('/auth/login');
    // Limpiar cookies por seguridad
    response.cookies.delete('userRole');
    response.cookies.delete('isAuthenticated');
    response.cookies.delete('isSuperAdmin');
    return response;

  } catch (error) {
    console.error('Middleware error detallado:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
    });
    
    const response = createRedirect('/auth/login');
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