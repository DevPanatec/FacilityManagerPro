'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { Send, Search, MoreVertical, MessageCircle, Paperclip, Smile, Image, Link, X } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/supabase/types';

const supabase = createClient();

type ChatMessage = Database['public']['Functions']['get_chat_messages_v2']['Returns'][0];

interface Message {
  id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  room_id: string;
  organization_id: string;
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  new: Database['public']['Tables']['chat_messages']['Row'];
}> & {
  new: Database['public']['Tables']['chat_messages']['Row'];
};

interface ChatViewProps {
  roomId: string;
  onClose: () => void;
  chatTitle?: string;
}

interface MessageGroup {
  userId: string;
  messages: Message[];
  date: string;
}

export function ChatView({ roomId, onClose, chatTitle }: ChatViewProps) {
  const { user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'none' | 'image' | 'file'>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const updateLastRead = useCallback(async () => {
    if (!user) return;
    try {
      await supabase
        .rpc('mark_chat_room_as_read', {
          p_room_id: roomId
        });
    } catch (error) {
      console.error('Error en updateLastRead:', error);
    }
  }, [roomId, user]);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .rpc('get_chat_messages_v2', {
          room_uuid: roomId,
          msg_limit: 100,
          msg_offset: 0
        });

      if (error) throw error;

      if (!data) {
        setMessages([]);
        return;
      }

      const typedMessages = data.map((msg): Message => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        status: msg.status,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        user_id: msg.user_id,
        room_id: msg.room_id,
        organization_id: msg.organization_id,
        user: {
          first_name: msg.first_name || 'Usuario',
          last_name: msg.last_name || 'Desconocido',
          avatar_url: msg.avatar_url
        }
      }));

      setMessages(typedMessages);
      await updateLastRead();
    } catch (error) {
      console.error('Error cargando chat:', error);
      toast.error('Error cargando los mensajes');
    } finally {
      setLoading(false);
    }
  }, [roomId, user, updateLastRead]);

  const handleNewMessage = useCallback(async (payload: RealtimePayload) => {
    if (!payload.new || !user) return;
    
    try {
      // Obtener los datos del usuario que envió el mensaje
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', payload.new.user_id)
        .single();

      if (userError) throw userError;

      const newMessage: Message = {
        id: payload.new.id,
        content: payload.new.content,
        type: payload.new.type,
        status: payload.new.status,
        created_at: payload.new.created_at,
        updated_at: payload.new.updated_at,
        user_id: payload.new.user_id,
        room_id: payload.new.room_id,
        organization_id: payload.new.organization_id,
        user: {
          first_name: userData?.first_name || 'Usuario',
          last_name: userData?.last_name || 'Desconocido',
          avatar_url: userData?.avatar_url || null
        }
      };

      setMessages(prev => [...prev, newMessage]);
      
      if (payload.new.user_id !== user.id) {
        await updateLastRead();
      }
    } catch (error) {
      console.error('Error procesando nuevo mensaje:', error);
    }
  }, [user, updateLastRead]);

  useEffect(() => {
    if (!user || userLoading) return;

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
      .subscribe();

    channelRef.current = channel;
    loadMessages();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [roomId, user, userLoading, loadMessages, handleNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
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
  };

  // Corregir el manejo del evento keydown para el textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Función para agrupar mensajes por fecha y usuario
  const groupMessages = (messages: Message[]): MessageGroup[] => {
    return messages.reduce((groups: MessageGroup[], message) => {
      const date = format(new Date(message.created_at), 'yyyy-MM-dd');
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.userId === message.user_id && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          userId: message.user_id,
          messages: [message],
          date
        });
      }

      return groups;
    }, []);
  };

  const formatDateHeader = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Hoy';
    if (isYesterday(messageDate)) return 'Ayer';
    return format(messageDate, "d 'de' MMMM, yyyy", { locale: es });
  };

  // Auto-resize del textarea
  const handleTextareaResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  // Función para manejar la búsqueda de mensajes
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim()) {
      setIsSearching(true);
      const filtered = messages.filter(message => 
        message.content.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setIsSearching(false);
      setFilteredMessages([]);
    }
  };

  // Función para manejar el estado de "escribiendo..."
  const handleTypingStatus = () => {
    if (!user) return;

    // Limpiar el timeout anterior si existe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emitir estado de escritura
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id }
    });

    // Establecer nuevo timeout
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: user.id }
      });
    }, 2000);
  };

  // Efecto para manejar eventos de escritura
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setIsTyping(true);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setIsTyping(false);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, user]);

  // Modificar el handleMessageChange para incluir el estado de escritura
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTextareaResize();
    handleTypingStatus();
  };

  // Función para manejar archivos adjuntos
  const handleAttachment = (type: 'image' | 'file') => {
    setAttachmentType(type);
    if (type === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando usuario...</p>
      </div>
    );
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
      {/* Header Mejorado */}
      <div className="border-b bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-primary text-lg font-bold">
                  {chatTitle?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              {isTyping && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  escribiendo...
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800">
                {chatTitle || 'Nueva conversación'}
              </h2>
              <span className="text-xs text-gray-500">
                {messages.length} mensajes
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Barra de búsqueda mejorada */}
        {showSearch && (
          <div className="border-b bg-white px-6 py-4">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar en la conversación..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchText && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setIsSearching(false);
                    setFilteredMessages([]);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {isSearching && (
              <div className="mt-2 text-sm text-gray-500">
                {filteredMessages.length} resultados encontrados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Área de mensajes con resultados de búsqueda */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
        {groupMessages(isSearching ? filteredMessages : messages).map((group, groupIndex) => (
          <div key={`${group.userId}-${group.date}-${groupIndex}`} 
            className={`space-y-4 ${
              isSearching ? 'opacity-60 hover:opacity-100 transition-opacity' : ''
            }`}
          >
            {/* Separador de fecha */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Grupo de mensajes */}
            <div className="space-y-1">
              {group.messages.map((message, messageIndex) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    message.user_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.user_id !== user?.id && messageIndex === 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {message.user.first_name[0]}
                        </span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`group max-w-[70%] ${
                      message.user_id === user?.id ? 'ml-4' : 'mr-4'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.user_id === user?.id
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                      } transition-all duration-200 hover:shadow-md`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <div className={`mt-1 text-[11px] ${
                        message.user_id === user?.id
                          ? 'text-white/70'
                          : 'text-gray-400'
                      } text-right`}>
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de input mejorada */}
      <div className="border-t bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-50 rounded-2xl shadow-sm ring-1 ring-gray-200/50">
            {/* Barra de herramientas */}
            <div className="absolute left-2 bottom-3 flex items-center gap-1">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-2 rounded-lg hover:bg-gray-200/50 transition-colors text-gray-500 hover:text-gray-700"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAttachment('image')}
                className="p-2 rounded-lg hover:bg-gray-200/50 transition-colors text-gray-500 hover:text-gray-700"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAttachment('file')}
                className="p-2 rounded-lg hover:bg-gray-200/50 transition-colors text-gray-500 hover:text-gray-700"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {/* Textarea con padding para los botones */}
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="w-full bg-transparent rounded-2xl border-0 pt-4 pb-4 pl-[7.5rem] pr-14 focus:ring-2 focus:ring-primary/20 focus:outline-none text-gray-800 resize-none placeholder:text-gray-400 min-h-[52px]"
              rows={1}
            />

            {/* Botón de enviar */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-3 bottom-3 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Inputs ocultos para archivos */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                // Manejar archivo
                console.log(e.target.files?.[0]);
              }}
            />
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                // Manejar imagen
                console.log(e.target.files?.[0]);
              }}
            />
          </div>

          {/* Panel de emojis */}
          {showEmojis && (
            <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-lg p-4 border">
              <div className="grid grid-cols-8 gap-2">
                {['😊', '😂', '❤️', '👍', '🎉', '🤔', '😅', '🙌'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojis(false);
                    }}
                    className="text-2xl hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 