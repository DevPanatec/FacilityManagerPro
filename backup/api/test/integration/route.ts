import { NextResponse } from 'next/server';
import { testService } from '@/services/testService';

export async function GET() {
  try {
    const results = {
      taskFlow: await testService.testTaskFlow()
    };

    return NextResponse.json({
      success: results.taskFlow.success,
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