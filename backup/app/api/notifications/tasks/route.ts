import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Lógica para manejar nuevas tareas
    // - Notificar al asignado
    // - Actualizar lista de tareas
    // - Registrar en el calendario

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 