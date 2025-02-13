import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Prioridades predefinidas por tipo
const PRIORITY_TYPES = {
  REPORT: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  TASK: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  INCIDENT: {
    MINOR: 'minor',
    MODERATE: 'moderate',
    MAJOR: 'major',
    CRITICAL: 'critical'
  }
} as const

// GET /api/priorities - Obtener prioridades
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')?.toUpperCase()

    if (!type) {
      return NextResponse.json(PRIORITY_TYPES)
    }

    if (!(type in PRIORITY_TYPES)) {
      throw new Error(`Tipo de prioridad no válido: ${type}`)
    }

    return NextResponse.json(PRIORITY_TYPES[type as keyof typeof PRIORITY_TYPES])
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al obtener prioridades' },
        { status: error.message.includes('No autorizado') ? 403 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al obtener prioridades' },
      { status: 400 }
    )
  }
}

// Tipos TypeScript
export type PriorityType = keyof typeof PRIORITY_TYPES
export type PriorityValue = typeof PRIORITY_TYPES[PriorityType][keyof typeof PRIORITY_TYPES[PriorityType]]

// POST /api/priorities - Crear prioridad
export async function POST(request: Request) {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al crear prioridad' },
        { status: error.message.includes('No autorizado') ? 403 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear prioridad' },
      { status: 400 }
    )
  }
}

// PUT /api/priorities/[id] - Actualizar prioridad
export async function PUT(request: Request) {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al actualizar prioridad' },
        { status: error.message.includes('No autorizado') ? 403 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar prioridad' },
      { status: 400 }
    )
  }
}

// DELETE /api/priorities/[id] - Eliminar prioridad
export async function DELETE(request: Request) {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Error al eliminar prioridad' },
        { status: error.message.includes('No autorizado') ? 403 : 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar prioridad' },
      { status: 400 }
    )
  }
} 