import { NextResponse } from 'next/server';
import { dataHubService } from '@/services/dataHubService';

export async function GET() {
  try {
    const result = await dataHubService.exportEnterpriseData('excel');
    
    return new NextResponse(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=organizaciones.xlsx'
      }
    });
  } catch (error) {
    console.error('Error en exportación:', error);
    return NextResponse.json(
      { error: 'Error al exportar a Excel' },
      { status: 500 }
    );
  }
} 