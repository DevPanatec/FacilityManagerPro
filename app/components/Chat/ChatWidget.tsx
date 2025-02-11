'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useUser } from '@/app/shared/hooks/useUser';
import { cn } from '@/app/lib/utils';
import { ChatList } from './ChatList';
import { NewChatView } from './NewChatView';
import { ChatView } from './ChatView';
import { usePathname } from 'next/navigation';
import type { ChatRoom } from '@/app/shared/types/chat';

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
  const [predefinedMessage, setPredefinedMessage] = useState<string | null>(null);
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

  function handleNewChat(roomId: string, message?: string) {
    setActiveRoomId(roomId);
    setPredefinedMessage(message || null);
    setView('chat');
  }

  function handleSelectChat(roomId: string, message?: string) {
    setActiveRoomId(roomId);
    setPredefinedMessage(message || null);
    setView('chat');
  }

  function handleBackToList() {
    setView('list');
    setActiveRoomId(null);
    setPredefinedMessage(null);
  }

  function handleStartNewChat() {
    setView('new');
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-[0_8px_28px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_8px_32px_-4px_rgba(59,130,246,0.6)] hover:scale-105 transition-all duration-300"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[420px] rounded-3xl bg-white/95 backdrop-blur-sm overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] border border-gray-200/60">
          <div className="flex flex-col h-[650px]">
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
                predefinedMessage={predefinedMessage || undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 