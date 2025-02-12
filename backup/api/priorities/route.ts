import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

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
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)

    const { data: priorities, error } = await supabase
      .from('priorities')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(priorities)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/priorities - Crear prioridad
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data: priority, error } = await supabase
      .from('priorities')
      .insert([{ ...body, organization_id: organizationId }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(priority)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/priorities/[id] - Actualizar prioridad
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()
    const { id, ...updateData } = body

    const { data: priority, error } = await supabase
      .from('priorities')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(priority)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/priorities/[id] - Eliminar prioridad
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw new Error('ID de prioridad no proporcionado')
    }

    const { error } = await supabase
      .from('priorities')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Prioridad eliminada exitosamente' })
  } catch (error) {
    return handleError(error)
  }
}

// Tipos TypeScript
export type PriorityType = keyof typeof PRIORITY_TYPES
export type PriorityValue = typeof PRIORITY_TYPES[PriorityType][keyof typeof PRIORITY_TYPES[PriorityType]] 