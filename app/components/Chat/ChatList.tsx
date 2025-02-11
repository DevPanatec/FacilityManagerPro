'use client';

import { useEffect, useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useUser } from '@/app/shared/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Search, X, Plus, FileText, Image as ImageIcon, AlertCircle, Star, Trash2 } from 'lucide-react';
import './styles.css';
import { toast } from 'react-hot-toast';
import type { ChatRoom } from '@/app/shared/types/chat';

const supabase = createClient();

interface Admin {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  online_status?: 'online' | 'offline';
  last_seen?: string;
}

interface ChatSuggestion {
  id: string;
  title: string;
  description: string;
  predefinedMessage: string;
}

const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'maintenance',
    title: 'Mantenimiento',
    description: 'Solicitar mantenimiento para equipos o instalaciones',
    predefinedMessage: 'Hola, necesito solicitar un servicio de mantenimiento para...'
  },
  {
    id: 'incident',
    title: 'Reportar Incidente',
    description: 'Informar sobre un incidente o problema',
    predefinedMessage: 'Hola, quiero reportar un incidente que ocurrió...'
  },
  {
    id: 'request',
    title: 'Solicitud General',
    description: 'Realizar una solicitud o consulta general',
    predefinedMessage: 'Hola, quisiera realizar una consulta sobre...'
  },
  {
    id: 'emergency',
    title: 'Emergencia',
    description: 'Reportar una situación de emergencia',
    predefinedMessage: 'Hola, necesito reportar una situación urgente...'
  }
];

interface ChatListProps {
  onSelectChat: (roomId: string, predefinedMessage?: string) => void;
  onChatsLoaded?: Dispatch<SetStateAction<ChatRoom[]>>;
  onNewChat?: () => void;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric',
    month: 'short'
  });
}

export function ChatList({ onSelectChat, onChatsLoaded, onNewChat }: ChatListProps) {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastScrollPosition = useRef(0);
  const refreshThreshold = 100; // pixels to pull down to trigger refresh
  const listRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ChatSuggestion | null>(null);

  const loadChats = useCallback(async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase.rpc('get_user_chat_rooms', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error en get_user_chat_rooms:', error);
        throw error;
      }

      // Validar que data existe y es un array
      if (!data || !Array.isArray(data)) {
        console.log('No se encontraron chats o el formato es inválido:', data);
        setChats([]);
        return;
      }

      const transformedChats: ChatRoom[] = data.map((chat: any) => ({
        room_id: chat.room_id || '',
        room_name: chat.room_name || 'Chat sin nombre',
        room_type: chat.room_type || 'direct',
        room_description: chat.room_description || null,
        organization_id: chat.organization_id || '',
        created_by: chat.created_by || '',
        created_at: chat.created_at || new Date().toISOString(),
        updated_at: chat.updated_at || new Date().toISOString(),
        last_message: chat.last_message ? {
          id: chat.last_message.id || '',
          content: chat.last_message.content || '',
          created_at: chat.last_message.created_at || new Date().toISOString(),
          user_id: chat.last_message.user_id || '',
          type: chat.last_message.type || 'text',
          file_url: chat.last_message.file_url,
          importance: chat.last_message.importance || 'normal'
        } : null,
        unread_count: chat.unread_count || 0,
        members: Array.isArray(chat.members) ? chat.members.map((member: any) => ({
          user_id: member.user_id || '',
          email: member.email || '',
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          role: member.role || 'member',
          online_status: member.online_status || 'offline',
          last_seen: member.last_seen || null
        })) : []
      }));

      console.log('Chats transformados:', transformedChats);
      setChats(transformedChats);
      onChatsLoaded?.(transformedChats);
    } catch (error) {
      console.error('Error cargando chats:', error);
      // En caso de error, establecer un array vacío para evitar errores de renderizado
      setChats([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, onChatsLoaded]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (listRef.current) {
      lastScrollPosition.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      const delta = e.touches[0].clientY - lastScrollPosition.current;
      if (delta > refreshThreshold && !isRefreshing) {
        setIsRefreshing(true);
        loadChats();
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    loadChats();

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
  }, [user, loadChats]);

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_admins_for_chat', {
        p_organization_id: user?.organization_id
      });
      
      if (error) throw error;
      
      const adminsWithStatus: Admin[] = (data || []).map((admin: Admin) => ({
        ...admin,
        online_status: Math.random() > 0.5 ? 'online' : 'offline', // Simulado por ahora
        last_seen: new Date(Date.now() - Math.random() * 10000000).toISOString()
      }));
      
      setAdmins(adminsWithStatus);
    } catch (error) {
      console.error('Error cargando administradores:', error);
    }
  };

  const handleNewChat = () => {
    setShowSuggestions(true);
    setSearchTerm('');
  };

  const handleSelectSuggestion = async (suggestion: ChatSuggestion) => {
    try {
      setSelectedSuggestion(suggestion);
      setShowSuggestions(false);
      setShowNewChat(true);
      
      console.log('Cargando admins para la sugerencia:', suggestion.title);
      const { data, error } = await supabase.rpc('get_available_admins_for_chat', {
        p_organization_id: user?.organization_id
      });

      if (error) {
        console.error('Error cargando administradores:', error);
        toast.error('Error al cargar los administradores disponibles');
        return;
      }

      console.log('Administradores disponibles:', data);
      setAdmins(data || []);
    } catch (error) {
      console.error('Error en handleSelectSuggestion:', error);
      toast.error('Error al procesar la selección');
    }
  };

  const handleSelectAdmin = async (adminId: string) => {
    try {
      if (!selectedSuggestion) {
        console.error('No hay sugerencia seleccionada');
        return;
      }

      console.log('Creando chat con admin:', adminId, 'para sugerencia:', selectedSuggestion.title);

      // Verificar si ya existe un chat directo con este admin
      const existingChat = chats.find(
        chat => chat.room_type === 'direct' && chat.members.some(m => m.user_id === adminId)
      );

      if (existingChat) {
        // Si existe un chat, solo seleccionarlo y pasar el mensaje predefinido
        onSelectChat(existingChat.room_id, selectedSuggestion.predefinedMessage);
        setShowNewChat(false);
        setSelectedSuggestion(null);
        return;
      }

      // Crear nuevo chat room
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Chat - ${selectedSuggestion.title}`,
          type: 'direct',
          organization_id: user?.organization_id,
          created_by: user?.id,
          status: 'active',
          description: `Chat para ${selectedSuggestion.title}`
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
          status: 'active'
        },
        {
          room_id: room.id,
          user_id: adminId,
          organization_id: user?.organization_id,
          role: 'admin',
          status: 'active'
        }
      ];

      const { error: membershipError } = await supabase
        .from('chat_room_members')
        .insert(memberships);

      if (membershipError) throw membershipError;

      console.log('Chat creado exitosamente');
      onSelectChat(room.id, selectedSuggestion.predefinedMessage);
      setShowNewChat(false);
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Error creando chat:', error);
      toast.error('Error al crear el chat');
    }
  };

  const renderMessagePreview = (message: ChatRoom['last_message']) => {
    if (!message) return 'No hay mensajes';

    switch (message.type) {
      case 'image':
        return (
          <div className="chat-list-preview">
            <img src={message.file_url} alt="Preview" className="preview-image" />
            <span>Imagen</span>
          </div>
        );
      case 'file':
        return (
          <div className="preview-file">
            <FileText className="w-4 h-4" />
            <span>Archivo adjunto</span>
          </div>
        );
      default:
        return message.content;
    }
  };

  const renderImportanceBadge = (importance?: string) => {
    if (!importance || importance === 'normal') return null;

    return (
      <span className={`message-badge badge-${importance}`}>
        {importance === 'urgent' ? 'Urgente' : 'Importante'}
      </span>
    );
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(chat =>
    chat.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.last_message?.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteChat = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que se abra el chat al hacer click en borrar
    
    try {
      if (!user?.id) return;

      // Primero desactivamos la membresía del usuario en el chat
      const { error: membershipError } = await supabase
        .from('chat_room_members')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error desactivando membresía:', membershipError);
        toast.error('Error al borrar el chat');
        return;
      }

      // Actualizar la lista de chats localmente
      setChats(prevChats => prevChats.filter(chat => chat.room_id !== roomId));
      toast.success('Chat eliminado correctamente');
    } catch (error) {
      console.error('Error borrando chat:', error);
      toast.error('Error al borrar el chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showSuggestions) {
    return (
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">¿Qué necesitas?</h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="input-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="chat-list p-4 space-y-3">
          {CHAT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all duration-200"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {suggestion.title}
              </h4>
              <p className="text-sm text-gray-500">
                {suggestion.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showNewChat) {
    return (
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Seleccionar Admin</h3>
              {selectedSuggestion && (
                <p className="text-sm text-gray-500 mt-1">
                  Para: {selectedSuggestion.title}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowNewChat(false);
                setSelectedSuggestion(null);
              }}
              className="input-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="chat-search">
            <Search className="chat-search-icon w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar administrador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chat-search-input"
            />
          </div>
        </div>

        <div 
          className="chat-list"
          ref={listRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {isRefreshing && (
            <div className="refresh-indicator">
              <div className="refresh-spinner" />
            </div>
          )}
          
          {filteredAdmins.map((admin) => (
            <button
              key={admin.user_id}
              onClick={() => handleSelectAdmin(admin.user_id)}
              className="chat-list-item group"
            >
              <div className="chat-list-avatar-wrapper">
                <div className="chat-list-avatar">
                  {admin.avatar_url ? (
                    <img
                      src={admin.avatar_url}
                      alt={admin.full_name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    admin.full_name[0].toUpperCase()
                  )}
                </div>
                <div className={`status-indicator ${admin.online_status === 'online' ? 'status-online' : 'status-offline'}`} />
              </div>
              <div className="chat-list-content">
                <div className="chat-list-header">
                  <h4 className="chat-list-name">{admin.full_name}</h4>
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                    {admin.role}
                  </span>
                </div>
                <p className="chat-list-message">
                  {admin.online_status === 'online' 
                    ? 'En línea' 
                    : `Última vez ${formatDistanceToNow(new Date(admin.last_seen || ''), { addSuffix: true, locale: es })}`
                  }
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (filteredChats.length === 0) {
    return (
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2 className="chat-sidebar-title">Chats</h2>
          <div className="chat-search">
            <Search className="chat-search-icon w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chat-search-input"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay chats activos
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {user?.role === 'enterprise'
              ? 'Inicia una conversación con un administrador'
              : 'Espera a que un usuario inicie una conversación'}
          </p>
          {user?.role === 'enterprise' && (
            <button
              onClick={handleNewChat}
              className="quick-action-button quick-action-primary"
            >
              <Plus className="w-5 h-5" />
              Nuevo Chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h1 className="chat-sidebar-title">Mensajes</h1>
      </div>
      
      <div className="chat-list" ref={listRef}>
        {isRefreshing && (
          <div className="refresh-indicator">
            <div className="refresh-spinner" />
          </div>
        )}
        
        {filteredChats.map((chat) => {
          const otherMember = chat.members.find(m => m.user_id !== user?.id);
          
          return (
            <button
              key={chat.room_id}
              onClick={() => onSelectChat(chat.room_id)}
              className="chat-list-item group"
            >
              <div className="chat-list-avatar-wrapper">
                <div className="chat-list-avatar">
                  {chat.room_name[0].toUpperCase()}
                </div>
                {otherMember && (
                  <div className={`status-indicator ${
                    otherMember.online_status === 'online' ? 'status-online' : 'status-offline'
                  }`} />
                )}
              </div>
              <div className="chat-list-content">
                <div className="chat-list-header">
                  <h3 className="chat-list-name">{chat.room_name}</h3>
                  {chat.last_message && chat.last_message.created_at && (
                    <span className="chat-list-time">
                      {formatTime(chat.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p className="chat-list-message">
                  {renderMessagePreview(chat.last_message)}
                </p>
                {chat.last_message?.importance && (
                  <div className="chat-list-badges">
                    {renderImportanceBadge(chat.last_message.importance)}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat.room_id, e)}
                className="delete-chat-button opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-red-50 rounded-full"
                title="Eliminar chat"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              {chat.unread_count > 0 && (
                <span className="chat-list-badge">
                  {chat.unread_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {user?.role === 'enterprise' && (
        <div className="chat-quick-actions">
          <button
            onClick={handleNewChat}
            className="quick-action-button"
          >
            <Plus className="w-5 h-5" />
            Nuevo Chat
          </button>
        </div>
      )}
    </div>
  );
} 