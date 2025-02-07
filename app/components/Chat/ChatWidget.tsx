'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useUser } from '@/app/shared/hooks/useUser';
import { cn } from '@/app/lib/utils';
import { ChatList } from './ChatList';
import { NewChatView } from './NewChatView';
import { ChatView } from './ChatView';
import { usePathname } from 'next/navigation';

interface ChatRoom {
  room_id: string;
  room_name: string;
  room_type: 'direct' | 'group';
  last_message: {
    content: string;
    created_at: string;
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
  unread_count: number;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  is_group: boolean;
}

interface ChatWidgetProps {
  className?: string;
  isEnterprise?: boolean;
}

// Rutas donde el chat no debe mostrarse
const EXCLUDED_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/inactive',
  '/auth',
  '/login',
  '/register'
];

export function ChatWidget({ className, isEnterprise = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Efecto para cerrar el chat cuando se cierra sesión o se cambia de ruta
  useEffect(() => {
    if (!user || !pathname || EXCLUDED_ROUTES.some(route => pathname.startsWith(route))) {
      setIsOpen(false);
      setView('list');
      setActiveRoomId(null);
    }
  }, [user, pathname]);

  // No renderizar el chat en rutas excluidas o cuando no hay usuario
  if (
    !user || 
    loading || 
    !pathname ||
    EXCLUDED_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return null;
  }

  function handleNewChat(roomId: string) {
    setActiveRoomId(roomId);
    setView('chat');
  }

  function handleSelectChat(roomId: string) {
    setActiveRoomId(roomId);
    setView('chat');
  }

  function handleBackToList() {
    setView('list');
    setActiveRoomId(null);
  }

  function handleStartNewChat() {
    setView('new');
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Botón flotante modernizado */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 rounded-lg bg-background shadow-xl border border-border overflow-hidden">
          {/* Header con título y botón de cerrar */}
          <div className="flex flex-col h-[32rem]">
            <div className="border-b px-4 py-3 flex items-center justify-between bg-primary/5">
              <h2 className="font-semibold text-foreground">
                {view === 'list' && 'Chats'}
                {view === 'new' && 'Nuevo Chat'}
                {view === 'chat' && 'Conversación'}
              </h2>
              {view === 'list' && (
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Nuevo Chat
                </button>
              )}
              {(view === 'new' || view === 'chat') && (
                <button
                  onClick={handleBackToList}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Contenido principal con fondo modernizado */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
              {view === 'list' && (
                <ChatList 
                  onSelectChat={handleSelectChat} 
                  onChatsLoaded={setChats}
                  onNewChat={user?.role === 'enterprise' ? handleStartNewChat : undefined}
                />
              )}
              {view === 'new' && (
                <NewChatView 
                  onClose={handleBackToList}
                  onChatCreated={handleNewChat}
                />
              )}
              {view === 'chat' && activeRoomId && (
                <ChatView 
                  roomId={activeRoomId}
                  onClose={handleBackToList}
                  chatTitle={chats.find(chat => chat.room_id === activeRoomId)?.room_name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 