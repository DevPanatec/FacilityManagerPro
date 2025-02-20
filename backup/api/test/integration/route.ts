import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { testService } from '@/app/services/testService';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    // Ejecutar pruebas de integración
    const results = await testService.testTaskFlow();

    return NextResponse.json({
      success: results.success,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Error en pruebas de integración:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en pruebas de integración'
      },
      { status: 500 }
    );
  }
} 