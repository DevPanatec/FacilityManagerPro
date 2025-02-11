import React, { useState } from 'react';
import { ChatView } from './ChatView';
import { ChatList } from './ChatList';

interface ChatProps {
  onClose: () => void;
}

export function Chat({ onClose }: ChatProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomTitle, setSelectedRoomTitle] = useState<string | null>(null);
  const [predefinedMessage, setPredefinedMessage] = useState<string | null>(null);

  const handleSelectChat = (roomId: string, message?: string) => {
    setSelectedRoomId(roomId);
    setPredefinedMessage(message || null);
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
          onChatsLoaded={(chats) => {
            // Actualizar el título del chat seleccionado si existe
            if (selectedRoomId) {
              const selectedChat = chats.find(chat => chat.room_id === selectedRoomId);
              if (selectedChat) {
                setSelectedRoomTitle(selectedChat.name);
              }
            }
          }}
        />
      )}
    </div>
  );
} 