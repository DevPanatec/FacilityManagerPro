import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}
