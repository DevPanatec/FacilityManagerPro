import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Unauthorized access. API key required.' },
    { status: 401 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'Unauthorized access. API key required.' },
    { status: 401 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Unauthorized access. API key required.' },
    { status: 401 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Unauthorized access. API key required.' },
    { status: 401 }
  )
} 