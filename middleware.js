import { NextResponse } from 'next/server';
import { getCSPDirective } from './app/csp-config';

export function middleware(request) {
  // Crear nueva respuesta en lugar de modificar la existente
  const response = NextResponse.next();

  // Lista de encabezados CSP que queremos eliminar o modificar
  const cspHeaders = [
    'content-security-policy',
    'Content-Security-Policy'
  ];

  // Eliminar cualquier encabezado CSP que pueda existir
  cspHeaders.forEach(header => {
    response.headers.delete(header);
  });

  // Obtener la directiva CSP con los hashes específicos
  const cspDirective = getCSPDirective();

  // Establecer nuestra propia política CSP que incluya los hashes específicos
  response.headers.set(
    'Content-Security-Policy',
    cspDirective
  );

  // Añadir encabezado personalizado para verificar que el middleware se ejecutó
  response.headers.set('X-CSP-Disabled-By-Middleware', 'true');

  return response;
}

// Establecer la configuración para que se ejecute primero y en todas las rutas
export const config = {
  matcher: '/(.*)',
}; 