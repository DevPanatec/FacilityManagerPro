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
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Login del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });

    if (authError) {
      console.error('Error de autenticación:', authError);
      let errorMessage = 'Error de autenticación';
      
      if (authError.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (authError.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
      }

      return NextResponse.json(
        { error: errorMessage },
        { 
          status: authError.status || 400,
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

    // Obtener información del usuario con roles
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        hospital:hospital_id (
          id,
          name
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
      return NextResponse.json(
        { error: 'Error al obtener permisos del usuario' },
        { status: 500 }
      );
    }

    if (!userData?.role) {
      console.error('Usuario sin rol asignado:', userData);
      return NextResponse.json(
        { error: 'Usuario sin rol asignado' },
        { status: 400 }
      );
    }

    // Crear sesión y establecer cookies
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

    // Establecer cookies seguras
    response.cookies.set('userRole', userData.role, {
      path: '/',
      secure: true,
      sameSite: 'strict',
      httpOnly: true
    });

    response.cookies.set('isAuthenticated', 'true', {
      path: '/',
      secure: true,
      sameSite: 'strict',
      httpOnly: true
    });

    response.cookies.set('isSuperAdmin', (userData.role === 'superadmin').toString(), {
      path: '/',
      secure: true,
      sameSite: 'strict',
      httpOnly: true
    });

    // Registrar en logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: authData.user.id,
          action: 'LOGIN',
          description: 'User logged in successfully',
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent'),
          metadata: {
            role: userData.role,
            hospital_id: userData.hospital_id,
            timestamp: new Date().toISOString()
          }
        }
      ]);

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