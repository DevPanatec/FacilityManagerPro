'use client';

import { useState } from 'react';
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
  is_group: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const { user } = useUser();
  const pathname = usePathname();

  // No mostrar el chat en la página de login
  if (!user || pathname === '/login' || pathname === '/register') return null;

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

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Botón flotante modernizado */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Panel de chat modernizado */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[400px] rounded-2xl border border-gray-200 shadow-2xl bg-white/95 backdrop-blur-sm transition-all duration-200">
          <div className="flex flex-col h-[600px]">
            {/* Header modernizado */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {view === 'list' && 'Mensajes'}
                    {view === 'new' && 'Nuevo Chat'}
                    {view === 'chat' && 'Chat'}
                  </h2>
                  {view === 'list' && (
                    <span className="text-xs text-gray-500">
                      {chats.length} conversaciones
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {view === 'list' && user?.role === 'enterprise' && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    onClick={() => setView('new')}
                  >
                    <span>Nuevo</span>
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}
                {(view === 'new' || view === 'chat') && (
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={handleBackToList}
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido principal con fondo modernizado */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
              {view === 'list' && (
                <ChatList 
                  onSelectChat={handleSelectChat} 
                  onChatsLoaded={setChats}
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