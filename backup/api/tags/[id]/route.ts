import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/tags/[id] - Obtener etiqueta
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: tag, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(tag)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// PUT /api/tags/[id] - Actualizar etiqueta
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('tags')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// DELETE /api/tags/[id] - Eliminar etiqueta
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 