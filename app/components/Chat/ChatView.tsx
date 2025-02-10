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
      console.log('Cargando mensajes para sala:', roomId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          users:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error cargando mensajes:', error);
        throw error;
      }

      if (!data) {
        setMessages([]);
        return;
      }

      console.log('Mensajes cargados:', data);

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
          first_name: msg.users?.first_name || 'Usuario',
          last_name: msg.users?.last_name || 'Desconocido',
          avatar_url: msg.users?.avatar_url
        }
      }));

      setMessages(typedMessages);
      await updateLastRead();
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  }, [roomId, user, updateLastRead]);

  const handleNewMessage = useCallback(async (payload: RealtimePayload) => {
    if (!payload.new || !user) return;
    
    try {
        console.log('Nuevo mensaje recibido:', payload.new);
        
        // Si el mensaje es del usuario actual, usar sus datos directamente
        if (payload.new.user_id === user.id) {
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
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    avatar_url: user.avatar_url || null
                }
            };
            
            setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (!exists) {
                    return [...prev, newMessage];
                }
                return prev;
            });
            return;
        }

        // Si el mensaje es de otro usuario, obtener sus datos
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_name, last_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

        if (userError) {
            console.error('Error obteniendo datos del usuario:', userError);
            return;
        }

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
                first_name: userData?.first_name || '',
                last_name: userData?.last_name || '',
                avatar_url: userData?.avatar_url || null
            }
        };

        setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (!exists) {
                return [...prev, newMessage];
            }
            return prev;
        });
        
        // Solo marcar como leído si el mensaje es de otro usuario
        await updateLastRead();
    } catch (error) {
        console.error('Error procesando nuevo mensaje:', error);
    }
}, [user, updateLastRead]);

  const ensureChatMembership = useCallback(async () => {
    if (!user) return false;

    try {
      // Verificar si ya existe una membresía (activa o inactiva)
      const { data: existingMembership, error: membershipError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error verificando membresía:', membershipError);
        return false;
      }

      if (existingMembership) {
        console.log('Membresía encontrada:', existingMembership);
        
        // Si la membresía existe pero está inactiva, activarla
        if (existingMembership.status !== 'active') {
          const { error: updateError } = await supabase
            .from('chat_room_members')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existingMembership.id);

          if (updateError) {
            console.error('Error activando membresía:', updateError);
            return false;
          }
          console.log('Membresía reactivada');
        }
        
        return true;
      }

      // Si no existe membresía, crear una nueva
      const { data: newMembership, error: insertError } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: roomId,
          user_id: user.id,
          organization_id: user.organization_id,
          role: 'member',
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creando membresía:', insertError);
        if (insertError.code === '23505') { // Error de duplicado
          // Intentar actualizar en lugar de insertar
          const { error: updateError } = await supabase
            .from('chat_room_members')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('room_id', roomId)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error actualizando membresía:', updateError);
            return false;
          }
          console.log('Membresía actualizada después de conflicto');
          return true;
        }
        return false;
      }

      console.log('Nueva membresía creada:', newMembership);
      return true;
    } catch (error) {
      console.error('Error en ensureChatMembership:', error);
      toast.error('Error al procesar la membresía del chat');
      return false;
    }
  }, [user, roomId]);

  useEffect(() => {
    if (!user || userLoading) return;

    let isSubscribed = true;
    let channel: RealtimeChannel | null = null;

    const initializeChat = async () => {
        if (!isSubscribed) return;
        
        try {
            setLoading(true);
            const membershipSuccess = await ensureChatMembership();
            
            if (membershipSuccess && isSubscribed) {
                await loadMessages();
                
                // Crear el canal solo si la membresía es exitosa
                channel = supabase.channel(`room:${roomId}`)
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
            }
        } catch (error) {
            console.error('Error inicializando chat:', error);
        } finally {
            if (isSubscribed) {
                setLoading(false);
            }
        }
    };

    initializeChat();

    return () => {
        isSubscribed = false;
        if (channel) {
            channel.unsubscribe();
        }
        channelRef.current = null;
    };
}, [roomId, user, userLoading, handleNewMessage, ensureChatMembership, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    const maxRetries = 3;
    let retryCount = 0;

    const attemptSend = async (): Promise<boolean> => {
        try {
            console.log(`Intento ${retryCount + 1} de enviar mensaje:`, {
                room_id: roomId,
                user_id: user.id,
                organization_id: user.organization_id,
                content: newMessage.trim()
            });

            // Verificar membresía antes de enviar
            const { data: membership, error: membershipError } = await supabase
                .from('chat_room_members')
                .select('id, status')
                .eq('room_id', roomId)
                .eq('user_id', user.id)
                .single();

            if (membershipError) {
                console.error('Error verificando membresía:', membershipError);
                return false;
            }

            if (!membership || membership.status !== 'active') {
                console.error('No hay membresía activa');
                await ensureChatMembership();
                return false;
            }

            const messageContent = newMessage.trim();
            setNewMessage(''); // Limpiar el input inmediatamente

            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    user_id: user.id,
                    content: messageContent,
                    organization_id: user.organization_id,
                    type: 'text',
                    status: 'sent'
                })
                .select(`
                    id,
                    content,
                    type,
                    status,
                    created_at,
                    updated_at,
                    user_id,
                    room_id,
                    organization_id
                `)
                .single();

            if (error) {
                console.error('Error enviando mensaje:', error);
                setNewMessage(messageContent); // Restaurar el mensaje si hay error
                if (error.code === '42P17' || error.code === 'PGRST301') {
                    toast.error('Error de permisos en el chat. Reintentando...');
                    await ensureChatMembership();
                    return false;
                } else if (error.message?.includes('timeout') || error.message?.includes('connect error')) {
                    console.log('Error de conexión, reintentando...');
                    return false;
                } else {
                    toast.error('Error al enviar el mensaje: ' + error.message);
                    return false;
                }
            }

            // Agregar el mensaje al estado local inmediatamente
            if (data) {
                const newMessage: Message = {
                    ...data,
                    user: {
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        avatar_url: user.avatar_url || null
                    }
                };

                console.log('Mensaje local formateado:', newMessage);
                setMessages(prevMessages => {
                    // Verificar si el mensaje ya existe
                    const exists = prevMessages.some(msg => msg.id === newMessage.id);
                    if (!exists) {
                        return [...prevMessages, newMessage];
                    }
                    return prevMessages;
                });
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }

            console.log('Mensaje enviado exitosamente:', data);
            return true;
        } catch (error) {
            console.error('Error en attemptSend:', error);
            return false;
        }
    };

    while (retryCount < maxRetries) {
      const success = await attemptSend();
      if (success) {
        return;
      }
      retryCount++;
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    if (retryCount === maxRetries) {
      toast.error('No se pudo enviar el mensaje después de varios intentos. Por favor, verifica tu conexión.');
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Mejorado */}
      <div className="border-b bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center ring-2 ring-blue-500/20 shadow-lg">
                <span className="text-blue-600 text-lg font-bold">
                  {chatTitle?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              {isTyping && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse shadow-md">
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
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:shadow-md active:scale-95">
              <MoreVertical className="w-5 h-5 text-gray-600" />
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
        {groupMessages(isSearching ? filteredMessages : messages).map((group, groupIndex) => (
          <div key={`${group.userId}-${group.date}-${groupIndex}`} 
            className={`space-y-4 ${
              isSearching ? 'opacity-60 hover:opacity-100 transition-opacity duration-200' : ''
            }`}
          >
            {/* Separador de fecha */}
            <div className="flex items-center justify-center">
              <div className="bg-white text-gray-600 text-xs px-4 py-1.5 rounded-full shadow-sm border border-gray-200/50">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Grupo de mensajes */}
            <div className="space-y-2">
              {group.messages.map((message, messageIndex) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    message.user_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.user_id !== user?.id && messageIndex === 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center ring-2 ring-blue-500/10 shadow-md">
                        <span className="text-sm font-semibold text-blue-600">
                          {message.user.first_name?.[0] || '?'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`group max-w-[70%] ${
                      message.user_id === user?.id ? 'ml-4' : 'mr-4'
                    }`}
                  >
                    {/* Nombre del remitente */}
                    {messageIndex === 0 && (
                      <div className={`text-sm mb-1 ${
                        message.user_id === user?.id 
                          ? 'text-right text-gray-600 font-medium' 
                          : 'text-left text-gray-600 font-medium'
                      }`}>
                        {message.user_id === user?.id 
                          ? 'Tú' 
                          : `${message.user.first_name || ''} ${message.user.last_name || ''}`}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.user_id === user?.id
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-md hover:shadow-lg'
                          : 'bg-white text-gray-800 shadow-md hover:shadow-lg rounded-bl-md border border-gray-100'
                      } transition-all duration-200`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <div className={`mt-1 text-[11px] ${
                        message.user_id === user?.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
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
      <div className="border-t bg-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-md ring-1 ring-gray-200">
            {/* Barra de herramientas */}
            <div className="absolute left-2 bottom-3 flex items-center gap-1">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 hover:shadow-md active:scale-95"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAttachment('image')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 hover:shadow-md active:scale-95"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAttachment('file')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 hover:shadow-md active:scale-95"
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
              className="w-full bg-transparent rounded-2xl border-0 pt-4 pb-4 pl-[7.5rem] pr-14 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 resize-none placeholder:text-gray-400 min-h-[52px]"
              rows={1}
            />

            {/* Botón de enviar */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-3 bottom-3 p-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg disabled:opacity-50 disabled:hover:bg-blue-500 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none active:scale-95"
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