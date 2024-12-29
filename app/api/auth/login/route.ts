import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/authService';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const authService = new AuthService();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Verificar intentos de login
    try {
      await authService.handleLoginAttempt(email, ip);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      await authService.recordFailedAttempt(email, ip);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Verificar si requiere 2FA
    const { data: userData } = await supabase
      .from('user_2fa')
      .select('is_enabled')
      .eq('user_id', data.user.id)
      .single();

    if (userData?.is_enabled) {
      return NextResponse.json({
        requires2FA: true,
        sessionId: data.session.id
      });
    }

    return NextResponse.json({ data });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 