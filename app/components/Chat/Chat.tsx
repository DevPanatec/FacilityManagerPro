import React, { useState } from 'react';
import { ChatView } from './ChatView';
import { ChatList } from './ChatList';
import type { ChatRoom } from '@/app/shared/types/chat';

interface ChatProps {
  onClose: () => void;
}

export function Chat({ onClose }: ChatProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomTitle, setSelectedRoomTitle] = useState<string | null>(null);
  const [predefinedMessage, setPredefinedMessage] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);

  const handleSelectChat = (roomId: string, message?: string) => {
    setSelectedRoomId(roomId);
    setPredefinedMessage(message || null);
    const selectedChat = chats.find(chat => chat.room_id === roomId);
    if (selectedChat) {
      setSelectedRoomTitle(selectedChat.room_name);
    }
  };

  return (
    <div className="chat-wrapper">
      {selectedRoomId ? (
        <ChatView
          roomId={selectedRoomId}
          onClose={() => {
            setSelectedRoomId(null);
            setPredefinedMessage(null);
          }}
          chatTitle={selectedRoomTitle || undefined}
          predefinedMessage={predefinedMessage || undefined}
        />
      ) : (
        <ChatList
          onSelectChat={handleSelectChat}
          onChatsLoaded={setChats}
        />
      )}
    </div>
  );
} 