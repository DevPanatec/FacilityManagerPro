import { createRouteHandlerClient } from '@supabase/ssr'
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener prioridades';
    const statusCode = 400;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Tipos TypeScript
export type PriorityType = keyof typeof PRIORITY_TYPES
export type PriorityValue = typeof PRIORITY_TYPES[PriorityType][keyof typeof PRIORITY_TYPES[PriorityType]]
