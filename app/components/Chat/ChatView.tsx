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

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  room_id: string;
  organization_id: string;
}

type RealtimePayload = RealtimePostgresChangesPayload<ChatMessage>;

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

  // Cargar mensajes
  useEffect(() => {
    if (userLoading) return;

    async function loadMessages() {
      try {
        if (!user) {
          console.error("Usuario no autenticado");
          toast.error('Por favor inicia sesión para ver los mensajes');
          return;
        }

        console.log('Verificando membresía para:', {
          roomId,
          userId: user.id
        });

        // Verificar membresía en la sala
        const { data: memberData, error: memberError } = await supabase
          .from('chat_room_members')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        if (memberError) {
          console.error('Error detallado:', {
            error: memberError,
            context: {
              roomId,
              userId: user.id
            }
          });
          toast.error(`Error de acceso: ${memberError.message}`);
          return;
        }

        if (!memberData) {
          console.error('Usuario no es miembro de la sala:', {
            roomId,
            userId: user.id
          });
          toast.error('No tienes acceso a esta sala de chat');
          return;
        }

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
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error cargando mensajes:', error);
          toast.error('Error cargando los mensajes');
          return;
        }

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
        console.error('Error detallado al cargar mensajes:', {
          error,
          context: {
            roomId,
            userId: user?.id
          }
        });
        toast.error('Error cargando los mensajes');
      }
      setLoading(false);
    }

    loadMessages();

    // Suscribirse a cambios en tiempo real
    const channel: RealtimeChannel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    // Función para procesar nuevos mensajes
    const handleNewMessage = async (payload: RealtimePayload) => {
      try {
        console.log('Nuevo mensaje recibido:', payload);
        
        if (!payload.new) {
          console.error('No hay datos nuevos en el payload');
          return;
        }

        const newData = payload.new as ChatMessage;
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name')
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
          user: userData as User
        };

        setMessages(current => [...current, newMessage]);
        await updateLastRead();
      } catch (error) {
        console.error('Error procesando mensaje en tiempo real:', error);
      }
    };

    // Suscribirse a cambios en los mensajes
    channel
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
          console.log(`Suscrito al canal room:${roomId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error en el canal de realtime');
          toast.error('Error en la conexión en tiempo real');
        }
      });

    // Actualizar último mensaje leído
    const updateLastRead = async () => {
      try {
        if (!user) {
          console.error("Usuario no autenticado");
          return;
        }

        const { error } = await supabase
          .from('chat_room_members')
          .update({ 
            last_read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating last_read:', error);
          toast.error('Error actualizando el estado de lectura');
        }
      } catch (error) {
        console.error('Error updating last_read:', error);
        toast.error('Error actualizando el estado de lectura');
      }
    };

    updateLastRead();
    
    return () => {
      console.log('Limpiando suscripción de realtime');
      channel.unsubscribe();
    };
  }, [roomId, user, userLoading]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      // Verificar membresía en la sala
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        console.error('Error: Usuario no es miembro de la sala', memberError);
        toast.error('No tienes permiso para enviar mensajes en esta sala');
        return;
      }

      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content: newMessage.trim(),
          user_id: user.id,
          type: 'text'
        });

      if (sendError) {
        console.error('Error al enviar mensaje:', sendError);
        toast.error('Error al enviar el mensaje: ' + sendError.message);
        return;
      }

      setNewMessage('');
      toast.success('Mensaje enviado');
    } catch (error) {
      console.error('Error sending message:', error);
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