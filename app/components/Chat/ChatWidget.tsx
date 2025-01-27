'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useUser } from '@/app/shared/hooks/useUser';
import { cn } from '@/app/lib/utils';
import { ChatList } from './ChatList';
import { NewChatView } from './NewChatView';
import { ChatView } from './ChatView';
import { usePathname } from 'next/navigation';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
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
      {/* Icono flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Panel de chat */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 rounded-lg border shadow-xl bg-white">
          <div className="flex flex-col h-[600px] bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
              <h2 className="text-lg font-semibold text-gray-900">
                {view === 'list' && 'Chat'}
                {view === 'new' && 'Nuevo Chat'}
                {view === 'chat' && 'Conversación'}
              </h2>
              <div className="flex items-center gap-2">
                {view === 'list' && user?.role === 'enterprise' && (
                  <button
                    className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setView('new')}
                  >
                    Nuevo Chat
                  </button>
                )}
                {(view === 'new' || view === 'chat') && (
                  <button
                    className="text-sm px-2 py-1 rounded-md hover:bg-gray-100"
                    onClick={handleBackToList}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 overflow-hidden bg-white">
              {view === 'list' && (
                <ChatList onSelectChat={handleSelectChat} />
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
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 