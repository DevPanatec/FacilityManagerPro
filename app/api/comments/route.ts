import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/comments - Obtener comentarios
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      throw new Error('Se requiere el ID de la tarea')
    }

    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        profiles!task_comments_user_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener comentarios' },
      { status: 500 }
    )
  }
}

// POST /api/comments - Crear comentario
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Crear comentario
    const { data, error } = await supabase
      .from('task_comments')
      .insert([
        {
          task_id: body.task_id,
          user_id: user.id,
          comment: body.comment
        }
      ])
      .select(`
        *,
        profiles!task_comments_user_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_comment',
          description: `Comment added to task ${body.task_id}`
        }
      ])

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear comentario' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/comments/[id] - Actualizar comentario
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Verificar propiedad del comentario
    const { data: { user } } = await supabase.auth.getUser()
    const { data: comment } = await supabase
      .from('task_comments')
      .select('user_id')
      .eq('id', body.id)
      .single()

    if (!comment || comment.user_id !== user?.id) {
      throw new Error('No autorizado para actualizar este comentario')
    }

    const { data, error } = await supabase
      .from('task_comments')
      .update({
        comment: body.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar comentario' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/comments/[id] - Eliminar comentario
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Verificar propiedad del comentario
    const { data: { user } } = await supabase.auth.getUser()
    const { data: comment } = await supabase
      .from('task_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment || comment.user_id !== user?.id) {
      throw new Error('No autorizado para eliminar este comentario')
    }

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Comentario eliminado exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar comentario' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 