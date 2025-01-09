'use client'
import { useState } from 'react'

interface ChatMessage {
  id: string
  message: string
  timestamp: Date
  isAdmin?: boolean
}

interface Admin {
  id: number
  nombre: string
  cargo: string
  role: string
}

interface ChatWidgetProps {
  isAdmin?: boolean
  isAdminPrincipal?: boolean
  adminList?: Admin[]
  currentAdminId?: number
}

export default function ChatWidget({ 
  isAdmin = false,
  isAdminPrincipal = false,
  adminList = [],
  currentAdminId = 0
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-96">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Chat de Soporte</h3>
          {isAdmin && (
            <p className="text-sm text-gray-500">
              {isAdminPrincipal ? 'Admin Principal' : 'Admin'}
            </p>
          )}
        </div>
        <div className="p-4 h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-4">
              <div className="font-medium">{msg.isAdmin ? 'Admin' : 'Usuario'}</div>
              <div className="mt-1 text-gray-600">{msg.message}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Escribe un mensaje..."
          />
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => {
              if (newMessage.trim()) {
                const message: ChatMessage = {
                  id: Date.now().toString(),
                  message: newMessage,
                  timestamp: new Date(),
                  isAdmin: isAdmin
                };
                setMessages([...messages, message]);
                setNewMessage('');
              }
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}