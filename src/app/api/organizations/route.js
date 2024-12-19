import { NextResponse } from 'next/server';
import { dataHubService } from '@/services/dataHubService';

export async function GET() {
  try {
    const data = await dataHubService.getDataHubSummary();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener organizaciones' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await dataHubService.createOrganization(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear organización' }, 
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await dataHubService.deleteOrganization(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la organización' }, 
      { status: 500 }
    );
  }
} 