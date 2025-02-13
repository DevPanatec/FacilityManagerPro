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
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar notificación de tarea'
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 