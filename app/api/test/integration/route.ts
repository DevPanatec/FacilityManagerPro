import { NextResponse } from 'next/server';
import { testService } from '@/app/services/testService';

export async function GET() {
  try {
    const results = {
      taskFlow: await testService.testTaskFlow(),
      security: await testService.testSecurityPermissions()
    };

    const allSuccess = results.taskFlow.success && results.security.success;

    return NextResponse.json({
      success: allSuccess,
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