'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { 
  Send, Search, MoreVertical, MessageCircle, Paperclip, 
  Smile, Image as ImageIcon, Link, X, Reply, Star,
  ThumbsUp, Heart, FileText, AlertCircle, Edit, Trash, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/app/lib/supabase/types';
import './styles.css';
import { useSupabase } from '@/app/lib/supabase/supabase-provider';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

const supabase = createClient();

type ChatMessage = Database['public']['Functions']['get_chat_messages_v2']['Returns'][0];

interface Message {
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

type UserRow = Database['public']['Tables']['users']['Row'];
type User = UserRow & {
  organization_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  online_status?: 'online' | 'offline';
};

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
  predefinedMessage?: string;
}

interface MessageGroup {
  userId: string;
  messages: Message[];
  date: string;
  groupId: string;
}

const REACTIONS = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '⭐', icon: Star },
];

export function ChatView({ roomId, onClose, chatTitle, predefinedMessage }: ChatViewProps) {
  const { user, loading: userLoading } = useUser();
  const { supabase: supabaseProvider } = useSupabase();
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastScrollPosition = useRef(0);
  const refreshThreshold = 100;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

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
        file_url: msg.file_url,
        importance: msg.importance,
        edited: msg.edited,
        reactions: msg.reactions,
        reply_to: msg.reply_to,
        user: {
          first_name: msg.users?.first_name || 'Usuario',
          last_name: msg.users?.last_name || 'Desconocido',
          avatar_url: msg.users?.avatar_url,
          online_status: msg.online_status
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
        
        const baseMessage = {
            id: payload.new.id,
            content: payload.new.content,
            type: payload.new.type as 'text' | 'image' | 'file',
            status: payload.new.status,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at,
            user_id: payload.new.user_id,
            room_id: payload.new.room_id,
            organization_id: payload.new.organization_id,
            file_url: payload.new.file_url || undefined,
            importance: payload.new.importance || undefined,
            edited: payload.new.edited || false,
            reactions: payload.new.reactions || undefined,
            reply_to: payload.new.reply_to || undefined
        };
        
        // Si el mensaje es del usuario actual, usar sus datos directamente
        if (payload.new.user_id === user.id) {
            const newMessage: Message = {
                ...baseMessage,
                user: {
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    avatar_url: user.avatar_url || null,
                    online_status: user.id ? 'online' : 'offline'
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
            .select('first_name, last_name, avatar_url, online_status')
            .eq('id', payload.new.user_id)
            .single();

        if (userError) {
            console.error('Error obteniendo datos del usuario:', userError);
            return;
        }

        const newMessage: Message = {
            ...baseMessage,
            user: {
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                avatar_url: userData.avatar_url || null,
                online_status: userData.online_status || 'offline'
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
            if (!user?.organization_id) {
                console.error('No organization_id found for user');
                toast.error('Error: Usuario sin organización asignada');
                return false;
            }

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

            const message = {
                room_id: roomId,
                user_id: user.id,
                organization_id: user.organization_id,
                content: messageContent,
                type: 'text',
                status: 'sent',
                reply_to: replyingTo ? {
                    id: replyingTo.id,
                    content: replyingTo.content,
                    user: {
                        first_name: replyingTo.user.first_name,
                        last_name: replyingTo.user.last_name
                    }
                } : null
            };

            const { data, error } = await supabase
                .from('chat_messages')
                .insert(message)
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
                        avatar_url: user.avatar_url || null,
                        online_status: user.online_status
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
          date,
          groupId: `${date}-${message.user_id}-${message.id}`
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      console.log('Iniciando carga de archivo:', file.name);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;
      
      console.log('Verificando bucket chat-attachments...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error('Error verificando buckets:', bucketsError);
        toast.error('Error al verificar el almacenamiento');
        return;
      }

      const bucketExists = buckets.some(b => b.name === 'chat-attachments');
      if (!bucketExists) {
        console.error('El bucket chat-attachments no existe');
        toast.error('El sistema de almacenamiento no está configurado correctamente');
        return;
      }

      console.log('Subiendo archivo a storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        toast.error('Error al subir el archivo');
        return;
      }

      console.log('Archivo subido exitosamente:', uploadData);

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        console.error('No se pudo obtener la URL pública');
        toast.error('Error al obtener la URL del archivo');
        return;
      }

      console.log('URL pública obtenida:', publicUrl);

      // Crear el mensaje con el archivo adjunto
      const messageData = {
        room_id: roomId,
        user_id: user.id,
        content: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: publicUrl,
        organization_id: user.organization_id,
        status: 'sent'
      };

      console.log('Creando mensaje con archivo:', messageData);

      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) {
        console.error('Error creando mensaje:', messageError);
        toast.error('Error al crear el mensaje');
        return;
      }

      console.log('Mensaje con archivo creado exitosamente:', message);
      toast.success('Archivo subido correctamente');
    } catch (error) {
      console.error('Error en handleFileUpload:', error);
      toast.error('Error al procesar el archivo');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const existingReaction = message.reactions?.find(r => r.emoji === emoji);
      const userReacted = existingReaction?.users.includes(user?.id || '');

      let updatedReactions = message.reactions || [];
      if (userReacted) {
        // Remover reacción
        updatedReactions = updatedReactions.map(r => 
          r.emoji === emoji 
            ? { ...r, users: r.users.filter(uid => uid !== user?.id) }
            : r
        ).filter(r => r.users.length > 0);
      } else {
        // Agregar reacción
        if (existingReaction) {
          updatedReactions = updatedReactions.map(r =>
            r.emoji === emoji
              ? { ...r, users: [...r.users, user?.id || ''] }
              : r
          );
        } else {
          updatedReactions = [...updatedReactions, {
            emoji,
            users: [user?.id || '']
          }];
        }
      }

      await supabase
        .from('chat_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, reactions: updatedReactions }
          : m
      ));
    } catch (error) {
      console.error('Error actualizando reacciones:', error);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ 
          content: newContent,
          edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, content: newContent, edited: true }
          : m
      ));
      setEditingMessage(null);
    } catch (error) {
      console.error('Error editando mensaje:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
    }
  };

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);

    // Actualizar contador de no leídos
    if (isNearBottom) {
      setUnreadCount(0);
      updateLastRead();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;

    if (diff < -50) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) {
      const { data } = await supabase
        .rpc('get_chat_messages_v2', { p_room_id: roomId });
      
      if (data) {
        setMessages(data);
      }
      setIsRefreshing(false);
    }
  };

  // Renderizar mensaje con todas las nuevas funcionalidades
  const renderMessage = (message: Message): JSX.Element => {
    return (
      <div 
        key={message.id}
        className={`message group ${message.user_id === user?.id ? 'outgoing' : 'incoming'}`}
      >
        {message.user_id !== user?.id && (
          <div className="message-avatar">
            {message.user.avatar_url ? (
              <img
                src={message.user.avatar_url}
                alt={`${message.user.first_name} ${message.user.last_name}`}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="avatar-placeholder">
                {message.user.first_name[0]}
              </span>
            )}
          </div>
        )}
        <div className="message-content">
          {message.user_id !== user?.id && (
            <span className="message-sender">
              {message.user.first_name} {message.user.last_name}
            </span>
          )}
          
          {message.reply_to && (
            <div className="reply-preview">
              <Reply className="w-4 h-4" />
              <span className="reply-author">
                {message.reply_to.user.first_name}:
              </span>
              <span className="reply-content">
                {message.reply_to.content}
              </span>
            </div>
          )}

          <div className="message-bubble">
            {editingMessage?.id === message.id ? (
              <input
                type="text"
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEdit(message.id, editingMessage.content);
                  } else if (e.key === 'Escape') {
                    setEditingMessage(null);
                  }
                }}
                className="edit-input"
                autoFocus
              />
            ) : (
              <>
                {message.type === 'text' && (
                  <p className="message-text">{message.content}</p>
                )}
                {message.type === 'image' && message.file_url && (
                  <div className="image-preview">
                    <img 
                      src={message.file_url} 
                      alt="Imagen compartida" 
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => message.file_url && window.open(message.file_url, '_blank')}
                    />
                    <div className="image-preview-overlay">
                      <button
                        onClick={() => message.file_url && window.open(message.file_url, '_blank')}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        title="Ver imagen completa"
                      >
                        <ImageIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                )}
                {message.type === 'file' && message.file_url && (
                  <div className="file-preview">
                    <div className="file-preview-icon">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="file-preview-content">
                      <p className="file-preview-name">{message.content}</p>
                      <p className="file-preview-size">
                        {message.file_url.split('.').pop()?.toUpperCase() || 'ARCHIVO'}
                      </p>
                    </div>
                    <div className="file-preview-actions">
                      <button
                        onClick={() => message.file_url && window.open(message.file_url, '_blank')}
                        className="file-preview-button"
                        title="Abrir archivo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </button>
                      <a
                        href={message.file_url}
                        download={message.content || 'archivo'}
                        className="file-preview-button"
                        title="Descargar archivo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="message-info">
            <span className="message-time">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {message.edited && (
              <span className="message-edited">(editado)</span>
            )}
            {message.importance && message.importance !== 'normal' && (
              <span className={`message-badge badge-${message.importance}`}>
                {message.importance === 'urgent' ? 'Urgente' : 'Importante'}
              </span>
            )}
          </div>

          {message.reactions && message.reactions.length > 0 && (
            <div className="message-reactions">
              {message.reactions.map((reaction) => {
                const ReactionIcon = REACTIONS.find(r => r.emoji === reaction.emoji)?.icon;
                return (
                  <button
                    key={`${message.id}-${reaction.emoji}`}
                    onClick={() => handleReaction(message.id, reaction.emoji)}
                    className={`reaction ${
                      reaction.users.includes(user?.id || '')
                        ? 'reaction-active'
                        : ''
                    }`}
                  >
                    {ReactionIcon && <ReactionIcon className="w-4 h-4" />} {reaction.users.length}
                  </button>
                );
              })}
            </div>
          )}

          <div className="message-actions">
            <button
              onClick={() => setReplyingTo(message)}
              className="message-action-button"
              title="Responder"
            >
              <Reply className="w-4 h-4" />
            </button>
            {message.user_id === user?.id && (
              <>
                <button
                  onClick={() => setEditingMessage(message)}
                  className="message-action-button"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(message.id)}
                  className="message-action-button"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modificar el useEffect para manejar el mensaje predefinido
  useEffect(() => {
    if (predefinedMessage) {
      console.log('Estableciendo mensaje predefinido:', predefinedMessage);
      setNewMessage(predefinedMessage);
      // Ajustar la altura del textarea después de establecer el mensaje
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [predefinedMessage]);

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
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={onClose} className="chat-header-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="chat-title">{chatTitle}</h2>
        <button className="chat-header-back">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => renderMessage(message))}
      </div>

      <div className="message-input">
        <div className="input-container">
          <textarea
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            className="input-textarea"
            rows={1}
            ref={textareaRef}
          />
          <div className="input-actions">
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <button 
              className="input-button"
              onClick={() => handleAttachment('image')}
              title="Adjuntar imagen"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              className="input-button"
              onClick={() => handleAttachment('file')}
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              className="send-button"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 