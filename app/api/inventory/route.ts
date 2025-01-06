import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error message';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error message';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error message';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error message';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
