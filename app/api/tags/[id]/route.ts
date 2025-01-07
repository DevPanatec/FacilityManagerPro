import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// PUT /api/tags/[id] - Actualizar etiqueta
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { name, color } = body

    const { data: tag, error } = await supabase
      .from('tags')
      .update({ name, color })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(tag)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// DELETE /api/tags/[id] - Eliminar etiqueta
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 