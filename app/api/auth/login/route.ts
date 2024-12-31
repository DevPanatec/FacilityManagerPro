import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    
    // Login del usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (authError) throw authError;

    // Obtener perfil del usuario con roles
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          roles (
            id,
            name,
            permissions
          )
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    // Crear sesión
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert([
        {
          user_id: authData.user.id,
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent')
        }
      ]);

    if (sessionError) throw sessionError;

    // Registrar en logs
    await supabase
      .from('system_audit_logs')
      .insert([
        {
          user_id: authData.user.id,
          action: 'LOGIN',
          details: 'User logged in successfully',
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent')
        }
      ]);

    return NextResponse.json({
      user: authData.user,
      profile: userData,
      session: {
        access_token: authData.session?.access_token,
        expires_at: authData.session?.expires_at
      }
    });

  } catch (error: any) {
    // Registrar intento fallido
    await supabase
      .from('security_logs')
      .insert([
        {
          event_type: 'LOGIN_FAILED',
          details: error.message,
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent')
        }
      ]);

    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
} 