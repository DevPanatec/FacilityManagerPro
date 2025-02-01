'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

async function getChatMessages(roomId: string, limit: number = 50, offset: number = 0) {
  const supabase = createClientComponentClient<Database>()
  const { data: messages, error } = await supabase
    .rpc('get_chat_room_messages_v1', {
      room_uuid: roomId,
      msg_limit: limit,
      msg_offset: offset
    })

  if (error) throw error
  return messages
}

export default async function ChatView({ params }: { params: { id: string } }) {
  const messages = await getChatMessages(params.id)

  return (
    <div>
      {/* Renderizar los mensajes aquí */}
    </div>
  )
} 