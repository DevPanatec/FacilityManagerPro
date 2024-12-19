import { NextResponse } from 'next/server';
import { auth } from '@/firebase/admin';
import { isSuperAdmin } from './admin/superadmin/createSuperAdmin';

export async function middleware(request) {
  // Si ya está en login, permitir
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  try {
    const session = request.cookies.get('session')?.value;
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const decodedToken = await auth.verifySessionCookie(session);
    
    // Verificar si es SuperAdmin
    const isSuperAdminUser = await isSuperAdmin(decodedToken.uid);

    // Si es SuperAdmin
    if (isSuperAdminUser) {
      // Si intenta acceder a login, redirigir a admin
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      // Permitir acceso a rutas admin
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next();
      }
      // Redirigir a admin si intenta acceder a otras rutas
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Para usuarios no SuperAdmin
    if (!request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    // Si no es SuperAdmin e intenta acceder a /admin
    return NextResponse.redirect(new URL('/login', request.url));

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}; 