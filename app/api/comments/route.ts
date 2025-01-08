import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la tarea' },
        { status: 400 }
      )
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
    console.error('Error al obtener comentarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

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
      .single()

    if (error) throw error

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
    console.error('Error al crear comentario:', error)
    return NextResponse.json(
      { error: 'Error al crear comentario' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: comment } = await supabase
      .from('task_comments')
      .select('user_id')
      .eq('id', body.id)
      .single()

    if (!comment || comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para actualizar este comentario' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('task_comments')
      .update({
        comment: body.comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al actualizar comentario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar comentario' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: comment } = await supabase
      .from('task_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment || comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar este comentario' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Comentario eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar comentario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar comentario' },
      { status: 500 }
    )
  }
} 