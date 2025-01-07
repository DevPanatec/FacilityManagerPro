import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Lógica para alertas de inventario
    // - Notificar al encargado de compras
    // - Actualizar reportes de inventario
    // - Generar orden de compra si es necesario

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
