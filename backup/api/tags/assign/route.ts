import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { taskId, tagId } = body

    if (!taskId || !tagId) {
      throw new Error('Se requieren taskId y tagId')
    }

    // Verificar que la tarea existe
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError
    if (!task) throw new Error('Tarea no encontrada')

    // Asignar tag a la tarea
    const { data, error } = await supabase
      .from('task_tags')
      .insert([{ task_id: taskId, tag_id: tagId }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al asignar tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { taskId, tagId } = body

    if (!taskId || !tagId) {
      throw new Error('Se requieren taskId y tagId')
    }

    const { error } = await supabase
      .from('task_tags')
      .delete()
      .match({ task_id: taskId, tag_id: tagId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al desasignar tag'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 