import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurar los métodos permitidos
const allowedMethods = ['POST', 'OPTIONS'];

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': allowedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: Request) {
  // Verificar el método
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse(
      JSON.stringify({ error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: {
          'Allow': allowedMethods.join(', '),
          'Content-Type': 'application/json',
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Validar el body de la petición
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error al parsear el body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Normalizar email
    const normalizedEmail = body.email.trim().toLowerCase();
    console.log('Intentando login con email:', normalizedEmail);

    // Login del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: body.password,
    });

    if (authError) {
      console.error('Error de autenticación:', authError);
      let errorMessage = 'Error de autenticación';
      let statusCode = 400;
      
      switch(true) {
        case authError.message?.includes('Invalid login credentials'):
          errorMessage = 'Email o contraseña incorrectos';
          break;
        case authError.message?.includes('Email not confirmed'):
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
          break;
        case authError.message?.includes('Too many requests'):
          errorMessage = 'Demasiados intentos. Por favor espera unos minutos';
          statusCode = 429;
          break;
        default:
          statusCode = authError.status || 400;
      }

      return NextResponse.json(
        { error: errorMessage },
        { 
          status: statusCode,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!authData?.user?.id) {
      console.error('No se pudo obtener la información del usuario');
      return NextResponse.json(
        { error: 'Respuesta de autenticación inválida' },
        { status: 400 }
      );
    }

    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status, hospital_id')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
      
      // Si es un error de permisos, intentar con los metadatos
      if (userError.code === '42501') {
        const userRole = authData.user.user_metadata?.role || 'usuario';
        console.log('Usando rol desde metadatos:', userRole);
        
        return NextResponse.json({
          user: {
            ...authData.user,
            role: userRole,
            status: 'active'
          },
          session: {
            access_token: authData.session?.access_token,
            expires_at: authData.session?.expires_at
          }
        });
      }

      return NextResponse.json(
        { error: 'Error al obtener permisos del usuario' },
        { status: 500 }
      );
    }

    // Verificar estado del usuario
    if (userData.status !== 'active') {
      return NextResponse.json(
        { error: 'Usuario inactivo o pendiente de aprobación' },
        { status: 403 }
      );
    }

    // Crear respuesta
    const response = NextResponse.json({
      user: {
        ...authData.user,
        ...userData
      },
      session: {
        access_token: authData.session?.access_token,
        expires_at: authData.session?.expires_at
      }
    });

    // Establecer cookies con opciones de seguridad
    const cookieOptions = {
      path: '/',
      secure: true,
      sameSite: 'strict' as const,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 // 7 días
    };

    response.cookies.set('userRole', userData.role, cookieOptions);
    response.cookies.set('isAuthenticated', 'true', cookieOptions);
    response.cookies.set('isSuperAdmin', (userData.role === 'superadmin').toString(), cookieOptions);

    // Registrar actividad exitosa
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: authData.user.id,
          action: 'LOGIN',
          description: 'User logged in successfully',
          metadata: {
            timestamp: new Date().toISOString(),
            role: userData.role,
            hospital_id: userData.hospital_id,
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
          }
        });
    } catch (logError) {
      // No interrumpir el login por error en logs
      console.error('Error al registrar actividad:', logError);
    }

    return response;

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: error.status ? `HTTP ${error.status}` : 'Error interno del servidor'
      },
      { status: error.status || 500 }
    );
  }
} 