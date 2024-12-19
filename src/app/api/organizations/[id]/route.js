import { NextResponse } from 'next/server';
import { dataHubService } from '@/services/dataHubService';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    const result = await dataHubService.deleteOrganization(id);
    
    if (!result.success) {
      throw new Error('No se pudo eliminar la organización');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al eliminar:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al eliminar la organización',
        details: error
      }, 
      { status: 500 }
    );
  }
} 