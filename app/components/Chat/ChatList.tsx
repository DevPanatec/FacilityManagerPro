'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface ChatRoom {
  room_id: string;
  room_name: string;
  is_group: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  other_user_id?: string;
  other_user_name?: string;
}

interface ChatListProps {
  onSelectChat: (roomId: string) => void;
  onChatsLoaded: (chats: ChatRoom[]) => void;
  onNewChat?: () => void;
}

export function ChatList({ onSelectChat, onChatsLoaded, onNewChat }: ChatListProps) {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadChats() {
      try {
        if (!user?.id) return;
        
        const { data, error } = await supabase
          .rpc('get_user_chat_rooms', {
            p_user_id: user.id
          });

        if (error) throw error;

        // Procesar los chats según el rol del usuario
        const processedChats = (data || []).map(chat => {
          if (user.role === 'enterprise' && !chat.is_group) {
            // Para usuarios enterprise en chats directos, mostrar solo el nombre del admin
            return {
              ...chat,
              room_name: chat.other_user_name || chat.room_name
            };
          }
          return chat;
        });

        setChats(processedChats);
        onChatsLoaded(processedChats);
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
        // Recargar chats cuando hay nuevos mensajes
        loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, onChatsLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-muted-foreground">No tienes chats activos</p>
        {user?.role === 'enterprise' && (
          <p className="text-sm mt-2">
            Haz clic en "Nuevo Chat" para comenzar una conversación con un administrador
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {/* Botón de nuevo chat para enterprise */}
      {user?.role === 'enterprise' && onNewChat && (
        <button
          onClick={onNewChat}
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
            <span className="text-primary font-semibold text-lg">
              {chat.room_name[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                {chat.room_name}
              </h3>
              {chat.last_message_at && (
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(chat.last_message_at), { 
                    addSuffix: true,
                    locale: es 
                  })}
                </span>
              )}
            </div>
            {chat.last_message && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {chat.last_message}
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