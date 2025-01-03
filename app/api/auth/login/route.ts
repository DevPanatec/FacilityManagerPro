import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    
    // Login del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });

    if (authError) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status || 400 }
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