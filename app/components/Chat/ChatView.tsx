'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  first_name: string;
  last_name: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: User;
}

interface PostgresChangesPayload {
  new: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
  };
}

interface ChatViewProps {
  roomId: string;
  onClose: () => void;
}

export function ChatView({ roomId, onClose }: ChatViewProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes
  useEffect(() => {
    async function loadMessages() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("Usuario no autenticado:", authError);
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userData) return;

        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            users (
              id,
              first_name,
              last_name
            )
          `)
          .eq('room_id', roomId)
          .eq('organization_id', userData.organization_id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error cargando mensajes:', error);
          return;
        }

        // Map the response to match the Message type
        const typedMessages = (data || []).map((msg: any): Message => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          user: {
            first_name: msg.users.first_name,
            last_name: msg.users.last_name
          }
        }));

        setMessages(typedMessages);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload: PostgresChangesPayload) => {
          // Cargar datos del usuario para el nuevo mensaje
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', payload.new.user_id)
            .single();

          if (userError) {
            console.error('Error loading user data:', userError);
            return;
          }

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            user: userData as User
          };

          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to chat messages');
        }
      });

    // Actualizar último mensaje leído
    const updateLastRead = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("Usuario no autenticado:", authError);
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!userData) return;

        const { error } = await supabase
          .from('chat_room_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .eq('organization_id', userData.organization_id);

        if (error) {
          console.error('Error updating last_read:', error);
        }
      } catch (error) {
        console.error('Error updating last_read:', error);
      }
    };

    updateLastRead();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content: newMessage.trim(),
          user_id: user.id,
          organization_id: userData.organization_id
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.user_id === user?.id ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.user_id === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              {message.user_id !== user?.id && (
                <p className="text-sm font-medium mb-1 text-gray-900">
                  {message.user.first_name} {message.user.last_name}
                </p>
              )}
              <p className={message.user_id === user?.id ? 'text-white' : 'text-gray-800'}>
                {message.content}
              </p>
            </div>
            <span className="text-xs text-gray-500 mt-1 px-1">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
                locale: es
              })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input para nuevo mensaje */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
} 