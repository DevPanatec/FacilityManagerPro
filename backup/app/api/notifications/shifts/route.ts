import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Lógica para manejar cambios de turno
    // - Notificar al personal afectado
    // - Actualizar calendario
    // - Registrar el cambio

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 