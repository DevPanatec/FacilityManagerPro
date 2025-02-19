import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/task-categories - Obtener categorías
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: categories, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(categories)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener categorías'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// POST /api/task-categories - Crear categoría
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('task_categories')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear categoría'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// PUT /api/task-categories/[id] - Actualizar categoría
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('task_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar categoría'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// DELETE /api/task-categories/[id] - Eliminar categoría
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID de categoría requerido')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar categoría'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 