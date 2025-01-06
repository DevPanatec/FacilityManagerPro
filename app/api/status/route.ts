import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Estados predefinidos por tipo
const STATUS_TYPES = {
  REPORT: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  TASK: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done'
  },
  EVALUATION: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  TIME_OFF: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  }
} as const

// GET /api/status - Obtener estados
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')?.toUpperCase()

    if (!type) {
      return NextResponse.json(STATUS_TYPES)
    }

    if (!(type in STATUS_TYPES)) {
      throw new Error(`Tipo de estado no válido: ${type}`)
    }

    return NextResponse.json(STATUS_TYPES[type as keyof typeof STATUS_TYPES])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener estados';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Tipos TypeScript
export type StatusType = keyof typeof STATUS_TYPES
export type StatusValue = typeof STATUS_TYPES[StatusType][keyof typeof STATUS_TYPES[StatusType]] 