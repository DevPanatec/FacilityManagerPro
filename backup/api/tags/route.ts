import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/tags - Obtener etiquetas
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(tags)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener tags'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// POST /api/tags - Crear etiqueta
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('tags')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 