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
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: status, error } = await supabase
      .from('status')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(status)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener estados'
    const status = errorMessage.includes('No autorizado') ? 403 : 400
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// Tipos TypeScript
export type StatusType = keyof typeof STATUS_TYPES
export type StatusValue = typeof STATUS_TYPES[StatusType][keyof typeof STATUS_TYPES[StatusType]]

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('status')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear estado'
    const status = errorMessage.includes('No autorizado') ? 403 : 400
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 