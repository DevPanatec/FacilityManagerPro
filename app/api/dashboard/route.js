import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 