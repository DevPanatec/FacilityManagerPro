export type ChatMessage = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export type ChatRoom = {
  id: string
  organization_id: string
  name?: string
  is_direct: boolean
  created_at: string
  updated_at: string
}

export type ChatParticipant = {
  id: string
  chat_room_id: string
  user_id: string
  joined_at: string
  last_read_at?: string
} 