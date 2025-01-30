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
  created_at: string;
  user_id: string;
  room_id: string;
  organization_id: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    organization_id: string;
  };
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
        // Verificar membresía en la sala con reintentos
        let memberData = null;
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries && !memberData) {
          console.log(`Intento ${retries + 1} de verificar membresía...`);
          
          const { data, error: memberError } = await supabase
            .from('chat_room_members')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberError) {
            console.error('Error verificando membresía:', memberError);
            toast.error('Error de acceso al chat');
            onClose();
            return;
          }

          if (data) {
            console.log('Membresía encontrada:', data);
            memberData = data;
            break;
          }

          console.log('Membresía no encontrada, reintentando...');
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!memberData) {
          console.error('No se encontró membresía después de reintentos');
          toast.error('No tienes acceso a esta sala de chat');
          onClose();
          return;
        }

        // Cargar mensajes
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            users (
              id,
              first_name,
              last_name,
              organization_id
            )
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error cargando mensajes:', messagesError);
          toast.error('Error cargando los mensajes');
          return;
        }

        const typedMessages = (messages || []).map((msg: ChatMessage): Message => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          user: {
            first_name: msg.users.first_name || 'Usuario',
            last_name: msg.users.last_name || 'Desconocido',
            organization_id: msg.users.organization_id || user?.organization_id || ''
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, organization_id')
        .eq('id', newData.user_id)
        .single();

      if (userError) {
        console.error('Error cargando datos del usuario:', userError);
        return;
      }

      const newMessage: Message = {
        id: newData.id,
        content: newData.content,
        created_at: newData.created_at,
        user_id: newData.user_id,
        user: {
          first_name: userData.first_name || 'Usuario',
          last_name: userData.last_name || 'Desconocido',
          organization_id: userData.organization_id
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
    if (!newMessage.trim() || !user?.id || !user?.organization_id) {
      console.log('Missing required data:', { user, newMessage });
      return;
    }

    try {
      // Verificar membresía en la sala
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error verificando membresía:', memberError);
        toast.error('Error de acceso al chat');
        return;
      }

      if (!memberData) {
        console.error('Usuario no es miembro de la sala');
        toast.error('No tienes permiso para enviar mensajes en esta sala');
        return;
      }

      // Enviar mensaje
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content: newMessage.trim(),
          user_id: user.id,
          organization_id: user.organization_id
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