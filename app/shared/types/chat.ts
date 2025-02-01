export interface Message {
  id: string
  organization_id: string
  room_id: string
  user_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  parent_id?: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  id: string
  organization_id: string
  message_id: string
  file_url: string
  file_type: string
  file_name: string
  file_size: number
  created_at: string
  updated_at: string
}

export interface RoomMember {
  room_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  last_read_at: string
  unread_count: number
  created_at: string
  updated_at: string
}

export interface ChatState {
  isLoading: boolean
  error: string | null
  activeRoom: string | null
  messages: { [key: string]: Message }
  members: RoomMember[]
  attachments: { [key: string]: MessageAttachment[] }
  typingUsers: { [key: string]: string }
  replyingTo: Message | null
} 