import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleError, validateAndGetUserOrg } from '@/app/utils/errorHandler'

// GET /api/chat - Obtener salas de chat y mensajes
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) throw new Error('Task ID no proporcionado')

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('task_id', taskId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/chat - Crear sala de chat o enviar mensaje
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId, organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        ...body,
        user_id: userId,
        organization_id: organizationId
      }])
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/chat/[id] - Actualizar sala de chat
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const body = await request.json()

    const { data, error } = await supabase
      .from('chat_messages')
      .update(body)
      .eq('id', body.id)
      .eq('organization_id', organizationId)
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/chat/[id] - Eliminar sala de chat o salir de ella
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { organizationId } = await validateAndGetUserOrg(supabase)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID no proporcionado')

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error

    return NextResponse.json({ message: 'Mensaje eliminado exitosamente' })
  } catch (error) {
    return handleError(error)
  }
} 