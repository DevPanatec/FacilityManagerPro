import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/tags - Obtener etiquetas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    // Obtener etiquetas con conteo de uso
    const { data: tags, error } = await supabase
      .from('tags')
      .select(`
        *,
        entity_tags (
          count
        )
      `)
      .eq('organization_id', organization_id)

    if (error) throw error

    return NextResponse.json(tags)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error fetching tags';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/tags - Crear etiqueta
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { name, color, organization_id } = body

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ 
        name, 
        color, 
        organization_id,
        created_by: user.id 
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(tag)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error creating tag';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
