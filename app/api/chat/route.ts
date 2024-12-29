import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/chat - Obtener salas de chat y mensajes
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Si se proporciona roomId, obtener mensajes de esa sala
    if (roomId) {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (before) {
        query = query.lt('created_at', before)
      }

      const { data: messages, error } = await query

      if (error) throw error

      // Marcar mensajes como leídos
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_room_id', roomId)
        .eq('user_id', user.id)

      return NextResponse.json(messages)
    }

    // Si no hay roomId, obtener las salas de chat del usuario
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_participants!chat_rooms_id_fkey (
          user_id,
          last_read_at,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        ),
        chat_messages!chat_rooms_id_fkey (
          content,
          created_at,
          sender:profiles!chat_messages_sender_id_fkey (
            first_name
          )
        )
      `)
      .order('updated_at', { ascending: false })

    if (roomsError) throw roomsError

    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener chat' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/chat - Crear sala de chat o enviar mensaje
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Si se proporciona roomId, enviar mensaje
    if (body.roomId) {
      // Verificar que el usuario es participante
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_room_id', body.roomId)
        .eq('user_id', user.id)
        .single()

      if (!participant) {
        throw new Error('No eres participante de esta sala')
      }

      // Enviar mensaje
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_room_id: body.roomId,
            sender_id: user.id,
            content: body.content
          }
        ])
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)

      if (error) throw error

      // Actualizar timestamp de la sala
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', body.roomId)

      return NextResponse.json(message[0])
    }

    // Si no hay roomId, crear nueva sala
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Crear sala
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert([
        {
          organization_id: profile.organization_id,
          name: body.name,
          is_direct: body.is_direct || false
        }
      ])
      .select()
      .single()

    if (roomError) throw roomError

    // Añadir participantes
    const participants = [user.id, ...(body.participants || [])]
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(
        participants.map(userId => ({
          chat_room_id: room.id,
          user_id: userId
        }))
      )

    if (participantsError) throw participantsError

    return NextResponse.json(room)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear chat' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/chat/[id] - Actualizar sala de chat
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el usuario es participante
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_room_id', body.id)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      throw new Error('No eres participante de esta sala')
    }

    const { data, error } = await supabase
      .from('chat_rooms')
      .update({
        name: body.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar sala' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/chat/[id] - Eliminar sala de chat o salir de ella
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Eliminar participación del usuario
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_room_id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ message: 'Saliste de la sala exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al salir de la sala' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 