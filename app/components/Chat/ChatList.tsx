'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatRoom {
  room_id: string;
  room_name: string;
  is_group: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ChatListProps {
  onSelectChat: (roomId: string) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
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
        setChats(data || []);
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
  }, [user?.id]);

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
    <div className="space-y-2">
      {chats.map((chat) => (
        <button
          key={chat.room_id}
          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
          onClick={() => onSelectChat(chat.room_id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-medium truncate">{chat.room_name}</h3>
              {chat.last_message_at && (
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(chat.last_message_at), { 
                    addSuffix: true,
                    locale: es 
                  })}
                </span>
              )}
            </div>
            {chat.last_message && (
              <p className="text-sm text-muted-foreground truncate">
                {chat.last_message}
              </p>
            )}
          </div>
          {chat.unread_count > 0 && (
            <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {chat.unread_count}
            </div>
          )}
        </button>
      ))}
    </div>
  );
} 