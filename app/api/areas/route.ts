import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

// GET /api/areas - Obtener áreas
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al obtener áreas:', error)
    return NextResponse.json(
      { error: 'Error al obtener áreas' },
      { status: 500 }
    )
  }
}

// POST /api/areas - Crear área
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al crear área:', error)
    return NextResponse.json(
      { error: 'Error al crear área' },
      { status: 500 }
    )
  }
}

// PUT /api/areas/[id] - Actualizar área
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('areas')
      .update({
        name: body.name,
        description: body.description,
        department_id: body.department_id
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al actualizar área:', error)
    return NextResponse.json(
      { error: 'Error al actualizar área' },
      { status: 500 }
    )
  }
}

// DELETE /api/areas/[id] - Eliminar área
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Área eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar área:', error)
    return NextResponse.json(
      { error: 'Error al eliminar área' },
      { status: 500 }
    )
  }
} 