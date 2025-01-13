'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ChatMessage {
  id: string
  message: string
  timestamp: Date
  isAdmin?: boolean
  sender_id?: string
  receiver_id?: string
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, payload => {
        const newMessage = payload.new as ChatMessage;
        setMessages(current => [...current, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const message = {
        message: newMessage.trim(),
        sender_id: user.id,
        receiver_id: isAdmin ? null : currentAdminId, // Si es admin, el mensaje es público
        timestamp: new Date(),
        isAdmin: isAdmin
      };

      const { error } = await supabase
        .from('messages')
        .insert([message]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-4 bg-[#4263eb] text-white rounded-full shadow-lg hover:bg-[#364fc7] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#4263eb] text-white p-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Chat de Soporte</h3>
          {isAdmin && (
            <p className="text-sm text-blue-100">
              {isAdminPrincipal ? 'Admin Principal' : 'Admin'}
            </p>
          )}
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-blue-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="bg-white h-96 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4263eb]"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`
                  max-w-[80%] rounded-lg px-4 py-2 
                  ${msg.isAdmin 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-[#4263eb] text-white'}
                `}
              >
                <p>{msg.message}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#4263eb] focus:border-transparent"
            placeholder="Escribe un mensaje..."
            rows={1}
          />
          <button 
            onClick={sendMessage}
            className="px-4 py-2 bg-[#4263eb] text-white rounded-lg hover:bg-[#364fc7] transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}