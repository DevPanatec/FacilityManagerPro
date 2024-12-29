import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Obtener estadísticas de login
    const { data: loginStats } = await supabase
      .from('login_attempts')
      .select('success, count(*)')
      .group('success');

    // Obtener eventos de seguridad recientes
    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      loginStats,
      recentEvents
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching security metrics' },
      { status: 500 }
    );
  }
} 