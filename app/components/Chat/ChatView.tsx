'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  user_id: string;
  user: {
    first_name: string;
    last_name: string;
    organization_id: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  room_id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  new: ChatMessage;
}>;

interface ChatViewProps {
  roomId: string;
  onClose: () => void;
}

export function ChatView({ roomId, onClose }: ChatViewProps) {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Cargar mensajes y configurar realtime
  useEffect(() => {
    if (!user || userLoading) return;

    async function loadMessages() {
      try {
        // Cargar mensajes usando la función RPC
        const { data, error: messagesError } = await supabase
          .rpc('get_chat_room_messages_v1', { 
            room_uuid: roomId
          }) as { data: ChatMessage[] | null, error: any };

        if (messagesError) {
          console.error('Error cargando mensajes:', messagesError);
          toast.error('Error cargando los mensajes');
          return;
        }

        const messages = data || [];
        const typedMessages = messages.map((msg: ChatMessage): Message => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          type: msg.type,
          status: msg.status,
          user: {
            first_name: msg.first_name || 'Usuario',
            last_name: msg.last_name || 'Desconocido',
            organization_id: user?.organization_id || ''
          }
        }));

        setMessages(typedMessages);

        // Actualizar último mensaje leído
        await updateLastRead();
      } catch (error) {
        console.error('Error cargando chat:', error);
        toast.error('Error cargando el chat');
      } finally {
        setLoading(false);
      }
    }

    // Configurar canal de realtime
    const channel = supabase.channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        handleNewMessage
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscrito a actualizaciones del chat');
        }
      });

    channelRef.current = channel;
    loadMessages();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId, user, userLoading]);

  // Manejar nuevos mensajes
  async function handleNewMessage(payload: RealtimePayload) {
    try {
      if (!payload.new) return;

      const newData = payload.new as ChatMessage;
      
      const newMessage: Message = {
        id: newData.id,
        content: newData.content,
        created_at: newData.created_at,
        user_id: newData.user_id,
        type: newData.type,
        status: newData.status,
        user: {
          first_name: newData.first_name || 'Usuario',
          last_name: newData.last_name || 'Desconocido',
          organization_id: newData.organization_id
        }
      };

      setMessages(current => [...current, newMessage]);
      await updateLastRead();
    } catch (error) {
      console.error('Error procesando nuevo mensaje:', error);
    }
  }

  // Actualizar último mensaje leído
  async function updateLastRead() {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .update({ 
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error actualizando último mensaje leído:', error);
      }
    } catch (error) {
      console.error('Error en updateLastRead:', error);
    }
  }

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim(),
          organization_id: user.organization_id,
          type: 'text',
          status: 'sent'
        });

      if (error) {
        console.error('Error enviando mensaje:', error);
        toast.error('Error al enviar el mensaje');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error en handleSendMessage:', error);
      toast.error('Error al enviar el mensaje');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.user_id === user?.id ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${
                message.user_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {message.user_id === user?.id
                  ? 'Tú'
                  : `${message.user.first_name} ${message.user.last_name}`}
              </div>
              <div>{message.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 