'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Search, X } from 'lucide-react';

const supabase = createClient();

interface Admin {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface ChatRoom {
  room_id: string;
  room_name: string;
  room_type: 'direct' | 'group';
  organization_id: string;
  created_at: string;
  updated_at: string;
  last_message: {
    content: string;
    created_at: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
    };
  } | null;
  unread_count: number;
  member_count: number;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  is_group: boolean;
}

interface ChatListProps {
  onSelectChat: (roomId: string) => void;
  onChatsLoaded?: (chats: ChatRoom[]) => void;
  onNewChat?: () => void;
}

export function ChatList({ onSelectChat, onChatsLoaded, onNewChat }: ChatListProps) {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadChats() {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase.rpc('get_user_chat_rooms', {
          p_user_id: user.id
        });

        if (error) throw error;

        // Transformar los datos al formato esperado por el componente
        const transformedChats: ChatRoom[] = (data || []).map((chat: any) => ({
          room_id: chat.room_id,
          room_name: chat.room_name,
          room_type: chat.room_type,
          organization_id: chat.organization_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          last_message: chat.last_message,
          unread_count: chat.unread_count,
          member_count: chat.member_count,
          other_user_id: chat.other_user_id,
          other_user_name: chat.other_user_name,
          other_user_avatar: chat.other_user_avatar,
          is_group: chat.room_type === 'group'
        }));

        setChats(transformedChats);
        onChatsLoaded?.(transformedChats);
      } catch (error) {
        console.error('Error cargando chats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChats();

    // Suscribirse a cambios en mensajes
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onChatsLoaded]);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_admins');
      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error cargando administradores:', error);
    }
  };

  const handleNewChat = () => {
    setShowNewChat(true);
    loadAdmins();
  };

  const handleSelectAdmin = async (adminId: string) => {
    try {
      // Verificar si ya existe un chat directo con este admin
      const existingChat = chats.find(
        chat => !chat.is_group && chat.other_user_id === adminId
      );

      if (existingChat) {
        onSelectChat(existingChat.room_id);
        setShowNewChat(false);
        return;
      }

      // Crear nuevo chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: 'Chat Directo',
          type: 'direct',
          organization_id: user?.organization_id,
          created_by: user?.id,
          status: 'active',
          is_private: true
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Crear membresías para ambos usuarios
      const memberships = [
        {
          room_id: room.id,
          user_id: user?.id,
          organization_id: user?.organization_id,
          role: 'member',
          status: 'active',
          created_by: user?.id
        },
        {
          room_id: room.id,
          user_id: adminId,
          organization_id: user?.organization_id,
          role: 'admin',
          status: 'active',
          created_by: user?.id
        }
      ];

      const { error: membershipError } = await supabase
        .from('chat_room_members')
        .insert(memberships);

      if (membershipError) throw membershipError;

      onSelectChat(room.id);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creando chat:', error);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showNewChat) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nuevo Chat</h3>
          <button
            onClick={() => setShowNewChat(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar administrador..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredAdmins.map((admin) => (
            <button
              key={admin.user_id}
              onClick={() => handleSelectAdmin(admin.user_id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {admin.avatar_url ? (
                  <img
                    src={admin.avatar_url}
                    alt={admin.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-semibold">
                    {admin.full_name[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900">{admin.full_name}</h4>
                <p className="text-sm text-gray-500">{admin.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-muted-foreground">No tienes chats activos</p>
        {user?.role === 'enterprise' && (
          <>
            <p className="text-sm mt-2">
              Inicia una conversación con un administrador
            </p>
            <button
              onClick={handleNewChat}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-200 font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              Nuevo Chat
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {user?.role === 'enterprise' && (
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-200 font-medium mb-4"
        >
          <MessageCircle className="w-5 h-5" />
          Nuevo Chat
        </button>
      )}

      {chats.map((chat) => (
        <button
          key={chat.room_id}
          className="w-full flex items-start gap-3 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 group"
          onClick={() => onSelectChat(chat.room_id)}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {chat.other_user_avatar ? (
              <img
                src={chat.other_user_avatar}
                alt={chat.room_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-primary font-semibold text-lg">
                {chat.room_name[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                {chat.room_name}
              </h3>
              {chat.last_message && (
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(chat.last_message.created_at), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              )}
            </div>
            {chat.last_message && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {chat.last_message.content}
              </p>
            )}
          </div>
          {chat.unread_count > 0 && (
            <div className="flex-shrink-0 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
              {chat.unread_count}
            </div>
          )}
        </button>
      ))}
    </div>
  );
} 