'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AttachmentButton } from './AttachmentButton'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@supabase/ssr'

interface ChatMessage {
  id: string
  type: 'report' | 'question' | 'other' | 'response'
  subject?: string
  context?: string
  message: string
  status: 'pending' | 'answered'
  responses?: Array<{
    id: string
    message: string
    timestamp: Date
    isAdmin: boolean
    attachment?: string
  }>
  attachment?: string
  timestamp: Date
  adminId?: number
  adminName?: string
}

interface Admin {
  id: number;
  nombre: string;
  avatar?: string;
  cargo?: string;
  role?: 'admin' | 'admin_principal';
}

interface ChatWidgetProps {
  isAdmin?: boolean;
  isEnterprise?: boolean;
  isAdminPrincipal?: boolean;
  onNewMessage?: (message: ChatMessage) => void;
  adminList?: Admin[];
  currentAdminId?: number;
}

const defaultAdminList: Admin[] = [
  { 
    id: 1, 
    nombre: "Juan Pérez", 
    cargo: "Admin Principal",
    avatar: "JP"
  },
  { 
    id: 2, 
    nombre: "María García", 
    cargo: "Admin Soporte",
    avatar: "MG"
  },
  { 
    id: 3, 
    nombre: "Carlos López", 
    cargo: "Admin Sistema",
    avatar: "CL"
  }
];

// Primero, definimos un tipo para el estado del chat
type ChatState = {
  view: 'list' | 'admin-select' | 'suggestions' | 'chat';
  selectedAdmin: Admin | null;
  showSuggestions: boolean;
};

// Agregar una función de verificación de tipo
const isSuggestionsView = (state: ChatState): boolean => {
  return state.view === 'suggestions' && state.selectedAdmin !== null;
};

// Primero, agregar una función para subir la imagen
async function handleImageUpload(file: File) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

export default function ChatWidget({ 
  isAdmin = false, 
  isEnterprise = false,
  isAdminPrincipal = false,
  onNewMessage,
  adminList = defaultAdminList,
  currentAdminId = 1
}: ChatWidgetProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [messageType, setMessageType] = useState<'report' | 'question' | 'other' | null>(null)
  const [context, setContext] = useState<string>('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [response, setResponse] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'report',
      subject: 'Problema con inventario',
      message: 'El stock actual no coincide con el sistema',
      status: 'pending',
      timestamp: new Date(Date.now() - 3600000),
      adminId: 3,
      adminName: "Carlos López"
    },
    {
      id: '2',
      type: 'question',
      message: '¿Se puede modificar el horario del turno de limpieza?',
      status: 'pending',
      timestamp: new Date(Date.now() - 7200000),
      adminId: 3,
      adminName: "Carlos López"
    },
    {
      id: '3',
      type: 'report',
      subject: 'Mantenimiento urgente',
      message: 'Se requiere reparación en área común',
      status: 'pending',
      timestamp: new Date(Date.now() - 10800000),
      adminId: 2,
      adminName: "María García"
    },
    {
      id: '4',
      type: 'other',
      message: 'Actualización de protocolos necesaria',
      status: 'pending',
      timestamp: new Date(Date.now() - 14400000),
      adminId: 2,
      adminName: "María García"
    },
    {
      id: '5',
      type: 'report',
      subject: 'Revisión general',
      message: 'Solicitud de inspección mensual',
      status: 'pending',
      timestamp: new Date(Date.now() - 18000000),
      adminId: 1,
      adminName: "Juan Pérez"
    }
  ])
  const [unreadCount, setUnreadCount] = useState(3)
  const [chatState, setChatState] = useState<ChatState>({
    view: 'list',
    selectedAdmin: null,
    showSuggestions: false
  });

  const suggestions = [
    { id: 1, title: 'Reportar problema de inventario', type: 'report', description: 'Notificar discrepancias o problemas con el inventario' },
    { id: 2, title: 'Consultar horarios', type: 'question', description: 'Preguntas sobre turnos y horarios del personal' },
    { id: 3, title: 'Solicitar acceso', type: 'other', description: 'Pedir acceso a sistemas o áreas específicas' },
    { id: 4, title: 'Reportar mantenimiento', type: 'report', description: 'Informar sobre equipos que necesitan mantenimiento' },
    { id: 5, title: 'Consultar procedimientos', type: 'question', description: 'Preguntas sobre protocolos y procedimientos' }
  ];

  const handleSuggestionClick = (suggestion: { title: string, type: string, description: string }) => {
    setMessageType(suggestion.type as 'report' | 'question' | 'other');
    setSubject(suggestion.title);
    setContext(suggestion.description);
    setChatState({
      ...chatState,
      view: 'chat',
      showSuggestions: false
    });
    setMessage('');
    setSelectedMessage(null);
    setIsOpen(true);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false)
    }

    // Usar el pathname para detectar cambios de ruta
    const currentPathname = window.location.pathname
    if (currentPathname !== pathname) {
      handleRouteChange()
    }
  }, [pathname])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!messageType || !message.trim() || !chatState.selectedAdmin) return
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: messageType,
      subject: subject.trim(),
      context: context.trim(),
      message: message.trim(),
      status: 'pending',
      timestamp: new Date(),
      adminId: chatState.selectedAdmin.id,
      adminName: chatState.selectedAdmin.nombre
    }
    
    // Agregar el mensaje al estado local y mantener el orden cronológico inverso
    setMessages(prevMessages => [newMessage, ...prevMessages])
    
    // Limpiar el formulario
    setMessage('')
    setSubject('')
    setContext('')
    
    // En lugar de setMessageType(null), seleccionamos el mensaje para ver el detalle
    setSelectedMessage(newMessage)
    
    // Notificar al enterprise
    if (onNewMessage) {
      onNewMessage(newMessage)
    }
    
    // Simular respuesta automática para el demo
    setTimeout(() => {
      const autoResponse: ChatMessage = {
        ...newMessage,
        id: Date.now().toString(),
        status: 'answered',
        responses: [{
          id: Date.now().toString(),
          message: '¡Mensaje recibido! Te responderemos pronto.',
          timestamp: new Date(),
          isAdmin: true
        }],
        timestamp: new Date()
      }
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id ? autoResponse : msg
        )
      )
    }, 2000)
  }

  // Modificar handleResponseSubmit para manejar la carga de imágenes
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || (!response.trim() && !attachment)) return;

    try {
      // Si hay un archivo adjunto, súbelo a Supabase
      let attachmentUrl: string | undefined = undefined;
      if (attachment) {
        attachmentUrl = await handleImageUpload(attachment);
      }

      // Crear un nuevo mensaje de respuesta
      const adminResponse = {
        id: Date.now().toString(),
        message: response.trim(),
        timestamp: new Date(),
        isAdmin: true,
        attachment: attachmentUrl
      };

      // Actualizar el mensaje seleccionado con la nueva respuesta
      const updatedMessage = {
        ...selectedMessage,
        status: 'answered' as const,
        responses: [...(selectedMessage.responses || []), adminResponse]
      };

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === selectedMessage.id ? updatedMessage : msg
        )
      );
      
      setUnreadCount(Math.max(0, unreadCount - 1));
      setResponse('');
      setAttachment(null);
      setSelectedMessage(updatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    }
  };

  const renderChatBubble = () => (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-circle btn-lg bg-primary text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>
    </div>
  )

  const renderMessageList = () => {
    // Filtrar mensajes según el rol
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    const currentAdminIdFromStorage = localStorage.getItem('adminId');
    
    console.log('isSuperAdmin:', isSuperAdmin);
    console.log('currentAdminId from storage:', currentAdminIdFromStorage);
    
    const filteredMessages = isSuperAdmin 
      ? messages // Super admin ve todos los mensajes
      : messages.filter(msg => msg.adminId?.toString() === currentAdminIdFromStorage); // Admin normal solo ve sus mensajes

    return (
      <div className="card w-96 bg-base-100 shadow-2xl border border-base-200">
        <div className="card-body p-0">
          <div className="bg-primary text-primary-content p-4 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="card-title text-primary-content font-bold">
                {isSuperAdmin 
                  ? `Todos los Mensajes (${messages.length})` 
                  : `Mis Mensajes (${filteredMessages.length})`}
              </h2>
              <button 
                className="btn btn-circle btn-sm bg-white/20 hover:bg-white/30 border-0 text-white" 
                onClick={() => setIsOpen(false)}
              >✕</button>
            </div>
          </div>
          
          <div className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent" 
               style={{ height: '500px' }}>
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="border-b last:border-b-0 p-4 hover:bg-base-100/60 cursor-pointer transition-all duration-200"
                onClick={() => setSelectedMessage(msg)}
              >
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-10 shadow-md">
                      <span>
                        {msg.adminName?.charAt(0) || 'A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-primary mb-1">
                      {msg.type === 'report' ? '🚨' : msg.type === 'question' ? '❓' : '💬'} 
                      {isSuperAdmin ? `${msg.adminName} (${getAdminCargo(msg.adminId)})` : 'Mensaje'}
                    </div>
                    <div className="font-medium truncate text-base-content/70">
                      {msg.subject || 'Sin asunto'}
                    </div>
                    <p className="text-sm opacity-70 truncate">{msg.message}</p>
                    <div className="text-xs opacity-50 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(new Date(msg.timestamp))}
                    </div>
                  </div>
                  {msg.status === 'pending' && (
                    <span className="badge badge-sm badge-primary animate-pulse">Nuevo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getAdminCargo = (adminId?: number) => {
    if (!adminId) return '';
    const admin = adminList.find(a => a.id === adminId);
    return admin?.cargo || '';
  };

  const renderMessageDetail = () => (
    <div className="card w-[450px] bg-base-100 shadow-2xl border border-base-200 flex flex-col">
      <div className="bg-primary text-primary-content p-4 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-circle btn-sm bg-white/20 hover:bg-white/30 border-0 text-white"
            onClick={() => setSelectedMessage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h2 className="card-title text-primary-content mb-1">
              {selectedMessage?.type === 'report' ? '🚨' : selectedMessage?.type === 'question' ? '❓' : '💬'} 
              {selectedMessage?.subject || 'Mensaje'}
            </h2>
            <p className="text-sm opacity-75 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(new Date(selectedMessage?.timestamp || ''))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent" style={{ maxHeight: '350px' }}>
        <div className="p-6 space-y-4">
          <div className="chat chat-start">
            <div className="chat-image avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10 shadow-md">
                <span>{isEnterprise ? 'AD' : isAdmin ? 'EN' : 'CF'}</span>
              </div>
            </div>
            {selectedMessage && renderMessageBubble(selectedMessage)}
          </div>

          {selectedMessage?.responses?.map((response, index) => (
            <div key={response.id} className="chat chat-end">
              <div className="chat-image avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10 shadow-md">
                  <span>AD</span>
                </div>
              </div>
              <div className="chat-bubble bg-primary text-primary-content shadow-md">
                <div className="font-bold mb-1">{isEnterprise ? 'Admin' : 'Enterprise'}</div>
                <p className="text-lg">{response.message}</p>
                {response.attachment && (
                  <div className="mt-2">
                    <img 
                      src={response.attachment} 
                      alt="Attached image" 
                      className="max-w-full rounded-lg shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t bg-base-100 p-4 rounded-b-2xl">
        <div className="divider my-0 text-base-content/50">Respuesta</div>
        <form onSubmit={handleResponseSubmit} className="space-y-3 mt-3">
          <div className="relative">
            <textarea 
              className="textarea textarea-bordered w-full min-h-[80px] text-lg pr-12"
              placeholder="Escribe tu respuesta..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (response.trim()) {
                    handleResponseSubmit(e)
                  }
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              {isEnterprise && (
                <AttachmentButton 
                  onFileSelect={handleFileSelect}
                  acceptedFileTypes="image/*"
                />
              )}
              <button 
                type="submit" 
                className="btn btn-circle btn-sm btn-primary"
                disabled={!response.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          {attachment && (
            <div className="mt-2 relative">
              <div className="relative border rounded-lg p-2">
                <img 
                  src={URL.createObjectURL(attachment)} 
                  alt="Preview" 
                  className="max-h-32 rounded"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
                  onClick={() => setAttachment(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )

  const handleAdminSelect = (admin: Admin) => {
    setChatState({
      ...chatState,
      view: 'suggestions',
      selectedAdmin: admin,
      showSuggestions: true
    });
  };

  const renderAdminList = () => (
    <div className="absolute bottom-16 right-0 w-96 bg-base-100 rounded-lg shadow-xl border border-base-200 z-50 max-h-[80vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Selecciona un administrador
          </h3>
          <button 
            onClick={() => setChatState({ ...chatState, view: 'list' })}
            className="btn btn-circle btn-sm btn-ghost"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {adminList.map((admin) => (
            <button
              key={admin.id}
              className="w-full text-left p-4 hover:bg-base-200 rounded-lg border border-base-200 hover:border-primary/20 transition-all duration-200 group"
              onClick={() => handleAdminSelect(admin)}
            >
              <div className="flex items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-12">
                    <span>{admin.avatar || admin.nombre.charAt(0)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-base-content">{admin.nombre}</div>
                  {admin.cargo && (
                    <div className="text-sm text-base-content/70">{admin.cargo}</div>
                  )}
                </div>
                <svg className="w-5 h-5 text-base-content/30 group-hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSuggestionsList = () => (
    <div className="absolute bottom-16 right-0 w-96 bg-base-100 rounded-lg shadow-xl border border-base-200 z-50">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-base-content flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Selecciona el tipo de mensaje
        </h3>
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full text-left p-4 hover:bg-base-200 rounded-lg border border-base-200 hover:border-primary/20 transition-all duration-200 group"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-base-content">{suggestion.title}</div>
                  <div className="text-sm text-base-content/70">{suggestion.description}</div>
                </div>
                <svg className="w-5 h-5 text-base-content/30 group-hover:text-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserChat = () => (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body p-0">
        <div className="bg-primary text-primary-content p-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="card-title text-primary-content">Chat</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  className="btn btn-circle btn-sm btn-ghost text-primary-content"
                  onClick={() => setChatState({
                    ...chatState,
                    showSuggestions: !chatState.showSuggestions
                  })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {chatState.showSuggestions && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-700"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button 
                className="btn btn-circle btn-sm btn-ghost text-primary-content" 
                onClick={() => setIsOpen(false)}
              >✕</button>
            </div>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {messageType ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {messageType === 'report' && (
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Asunto del reporte..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              )}
              <textarea 
                className="textarea textarea-bordered w-full min-h-[120px]" 
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (message.trim()) {
                      handleSubmit(e)
                    }
                  }
                }}
                required
              />
              <div className="flex items-center gap-2">
                {isEnterprise && (
                  <AttachmentButton 
                    onFileSelect={handleFileSelect}
                    acceptedFileTypes="image/*"
                  />
                )}
                <div className="flex justify-end gap-2 flex-1">
                  <button type="button" className="btn bg-base-200" onClick={() => setMessageType(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Enviar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <div className="chat chat-end">
                      <div className="chat-bubble chat-bubble-primary">
                        {msg.subject && <div className="font-bold">{msg.subject}</div>}
                        <p>{msg.message}</p>
                        <div className="text-xs opacity-75 mt-1">
                          {formatDate(new Date(msg.timestamp))}
                        </div>
                      </div>
                    </div>
                    {msg.responses && msg.responses.length > 0 && msg.responses.map((response) => (
                      <div key={response.id} className="chat chat-start">
                        <div className="chat-bubble bg-base-200">
                          {response.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <button className="btn w-full btn-primary" onClick={() => setMessageType('report')}>
                  Reporte
                </button>
                <button className="btn w-full btn-primary" onClick={() => setMessageType('question')}>
                  Pregunta
                </button>
                <button className="btn w-full btn-primary" onClick={() => setMessageType('other')}>
                  Otro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setAttachment(file);
    } else {
      // Opcional: Mostrar un mensaje de error si el archivo no es una imagen
      console.error('Por favor selecciona una imagen');
    }
  };

  const renderMessageBubble = (msg: ChatMessage) => (
    <div className="chat-bubble bg-base-200 text-gray-800 shadow-md">
      <div className="font-bold text-primary mb-1">
        {isEnterprise ? 'Admin' : isAdmin ? 'Enterprise' : 'Cliente Final'}
      </div>
      {msg.context && (
        <div className="bg-base-300/50 p-3 rounded-lg mb-3 text-sm">
          <span className="font-semibold">Contexto:</span> {msg.context}
        </div>
      )}
      <p className="text-lg">{msg.message}</p>
      {msg.attachment && (
        <div className="mt-2">
          <img 
            src={msg.attachment} 
            alt="Attached image" 
            className="max-w-full rounded-lg shadow-sm"
          />
        </div>
      )}
    </div>
  )

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Modificar el botón "+" para mostrar la lista de admins
  const handleNewChatClick = () => {
    setChatState({
      view: 'admin-select',
      selectedAdmin: null,
      showSuggestions: false
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="relative">
          {isEnterprise && !selectedMessage && !messageType && (
            <button 
              onClick={handleNewChatClick}
              className="absolute bottom-4 right-4 btn btn-circle btn-sm bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="relative">
            {selectedMessage ? (
              renderMessageDetail()
            ) : messageType ? (
              renderUserChat()
            ) : (
              <>
                {renderMessageList()}
                {chatState.view === 'admin-select' && renderAdminList()}
                {isSuggestionsView(chatState) && renderSuggestionsList()}
              </>
            )}
          </div>
        </div>
      ) : (
        renderChatBubble()
      )}
    </div>
  )
}