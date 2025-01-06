import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Obtener estadísticas de intentos de login
    const { data: loginStats } = await supabase
      .from('login_attempts')
      .select('success')
      .then(result => {
        const stats = result.data?.reduce((acc: any, curr: any) => {
          acc[curr.success ? 'successful' : 'failed'] = (acc[curr.success ? 'successful' : 'failed'] || 0) + 1
          return acc
        }, {})
        return { data: stats || { successful: 0, failed: 0 } }
      });

    // Obtener eventos de seguridad recientes
    const { data: recentEvents } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Obtener alertas activas
    const { data: activeAlerts } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('status', 'active')
      .order('severity', { ascending: false });

    return NextResponse.json({
      login_attempts: loginStats,
      recent_events: recentEvents || [],
      active_alerts: activeAlerts || []
    });
  } catch (error: unknown) {
    console.error('Error obteniendo métricas de seguridad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener métricas de seguridad';
    const statusCode = 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 