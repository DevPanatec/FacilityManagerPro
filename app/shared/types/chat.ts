export interface Message {
  id: string
  organization_id: string
  room_id: string
  user_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  parent_id: string | null
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

export interface ChatRoom {
  room_id: string;
  room_name: string;
  room_type: string;
  room_description: string | null;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    type?: 'text' | 'image' | 'file';
    file_url?: string;
    importance?: 'normal' | 'urgent' | 'important';
  } | null;
  unread_count: number;
  members: {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    online_status?: 'online' | 'offline';
    last_seen?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  room_id: string;
  organization_id: string;
  file_url?: string;
  importance?: 'normal' | 'urgent' | 'important';
  edited?: boolean;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  reply_to?: {
    id: string;
    content: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    online_status?: 'online' | 'offline';
  };
} 