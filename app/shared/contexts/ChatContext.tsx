'use client'

import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { FileService, FileType } from '@/app/shared/services/fileService'
import { useSupabaseConnection } from '@/app/shared/hooks/useSupabaseConnection'
import { toast } from 'react-hot-toast'
import { useMessageCache } from '@/app/shared/hooks/useMessageCache'
import { useUser } from '@/app/shared/hooks/useUser'

// Tipos
export interface Room {
  id: string
  organization_id: string
  name: string
  type: 'group' | 'direct' | 'channel'
  description: string | null
  created_by: string
  is_private: boolean
  created_at: string
  updated_at: string
  members: string[]
}

export interface Message {
  id: string
  organization_id: string
  room_id: string
  user_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  parent_id: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  reactions?: { user_id: string; reaction: string }[]
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  id: string
  organization_id: string
  message_id: string
  file_url: string
  file_type: string
  file_name: string
  file_size: number
  created_at: string
  updated_at: string
}

export interface ChatState {
  activeRoom: Room | null
  rooms: Room[]
  messages: Record<string, Message[]>
  members: Record<string, RoomMember[]>
  attachments: Record<string, MessageAttachment[]>
  typingUsers: Record<string, string[]>
  unreadCounts: Record<string, number>
  replyingTo: Message | null
  isLoading: boolean
  error: string | null
  connectionState: {
    isConnected: boolean
    isReconnecting: boolean
    lastError: string | null
  }
  pagination: {
    hasMore: boolean
    isLoadingMore: boolean
    lastMessageTimestamp: string | null
  }
}

type ChatAction =
  | { type: 'SET_ACTIVE_ROOM'; payload: Room | null }
  | { type: 'SET_ROOMS'; payload: Room[] }
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { roomId: string | undefined; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { roomId: string | undefined; message: Message } }
  | { type: 'DELETE_MESSAGE'; payload: { roomId: string | undefined; messageId: string } }
  | { type: 'SET_TYPING_USER'; payload: { roomId: string | undefined; userId: string } }
  | { type: 'REMOVE_TYPING_USER'; payload: { roomId: string | undefined; userId: string } }
  | { type: 'SET_REPLYING_TO'; payload: Message | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATE'; payload: { isConnected: boolean; isReconnecting: boolean; lastError: string | null } }
  | { type: 'SET_UNREAD_COUNT'; payload: { roomId: string; count: number } }
  | { type: 'SET_ATTACHMENTS'; payload: { messageId: string; attachments: MessageAttachment[] } }
  | { type: 'SET_MEMBERS'; payload: { roomId: string; members: RoomMember[] } }
  | { type: 'SET_PAGINATION'; payload: { hasMore: boolean; isLoadingMore: boolean; lastMessageTimestamp: string | null } }

const initialState: ChatState = {
  activeRoom: null,
  rooms: [],
  messages: {},
  members: {},
  attachments: {},
  typingUsers: {},
  unreadCounts: {},
  replyingTo: null,
  isLoading: false,
  error: null,
  connectionState: {
    isConnected: false,
    isReconnecting: false,
    lastError: null
  },
  pagination: {
    hasMore: false,
    isLoadingMore: false,
    lastMessageTimestamp: null
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ACTIVE_ROOM':
      if (!action.payload || state.activeRoom?.id === action.payload.id) {
        return { ...state, activeRoom: action.payload }
      }
      return { 
        ...state, 
        activeRoom: action.payload,
        messages: {
          ...state.messages,
          [action.payload.id]: state.messages[action.payload.id] || []
        },
        isLoading: true 
      }
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload }
    case 'SET_MESSAGES': {
      const { roomId, messages } = action.payload
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: messages
        }
      }
    }
    case 'ADD_MESSAGE': {
      const { roomId, message } = action.payload
      if (!roomId) return state
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: [
            ...(state.messages[roomId] || []),
            message
          ]
        }
      }
    }
    case 'UPDATE_MESSAGE': {
      const { roomId, message } = action.payload
      if (!roomId) return state
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: state.messages[roomId]?.map(
            m => m.id === message.id ? message : m
          ) || []
        }
      }
    }
    case 'DELETE_MESSAGE': {
      const { roomId, messageId } = action.payload
      if (!roomId) return state
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: state.messages[roomId]?.filter(
            m => m.id !== messageId
          ) || []
        }
      }
    }
    case 'SET_TYPING_USER': {
      const { roomId, userId } = action.payload
      if (!roomId) return state
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [roomId]: [
            ...(state.typingUsers[roomId] || []),
            userId
          ]
        }
      }
    }
    case 'REMOVE_TYPING_USER': {
      const { roomId, userId } = action.payload
      if (!roomId) return state
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [roomId]: state.typingUsers[roomId]?.filter(
            id => id !== userId
          ) || []
        }
      }
    }
    case 'SET_REPLYING_TO':
      return { ...state, replyingTo: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload }
    case 'SET_UNREAD_COUNT': {
      const { roomId, count } = action.payload
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [roomId]: count
        }
      }
    }
    case 'SET_ATTACHMENTS': {
      const { messageId, attachments } = action.payload
      return {
        ...state,
        attachments: {
          ...state.attachments,
          [messageId]: attachments
        }
      }
    }
    case 'SET_MEMBERS': {
      const { roomId, members } = action.payload
      return {
        ...state,
        members: {
          ...state.members,
          [roomId]: members
        }
      }
    }
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload }
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  dispatch: React.Dispatch<ChatAction>
  sendMessage: (
    content: string,
    parentId?: string,
    files?: File[],
    onUploadProgress?: (fileName: string, progress: number) => void
  ) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: (roomId: string) => Promise<void>
  createRoom: (name: string, members: string[]) => Promise<void>
  setTyping: (isTyping: boolean) => void
  setReplyingTo: (message: Message | null) => void
  getMessageAttachments: (messageId: string) => Promise<MessageAttachment[]>
  loadMessages: (roomId: string, limit?: number) => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Función auxiliar para convertir array de mensajes a Record
function messagesToRecord(messages: Message[]): Record<string, Message> {
  return messages.reduce((acc, message) => ({
    ...acc,
    [message.id]: message
  }), {})
}

const MAX_RECONNECTION_ATTEMPTS = Number(process.env.NEXT_PUBLIC_REALTIME_MAX_RETRIES) || 3;
const RECONNECTION_TIMEOUT = Number(process.env.NEXT_PUBLIC_REALTIME_TIMEOUT) || 10000;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const supabase = createClientComponentClient<Database>()
  const { user } = useUser()
  const { isConnected, isReconnecting, lastError, subscribeToChannel } = useSupabaseConnection()
  const { getMessages, setMessages } = useMessageCache()
  const fileService = new FileService()

  useEffect(() => {
    const handleConnectionChange = () => {
      dispatch({
        type: 'SET_CONNECTION_STATE',
        payload: { 
          isConnected, 
          isReconnecting, 
          lastError: lastError?.message || null 
        }
      })

      if (!isConnected && !isReconnecting) {
        // Cargar mensajes del caché cuando se pierde la conexión
        if (state.activeRoom) {
          const cachedMessages = getMessages(state.activeRoom.id)
          if (cachedMessages.length > 0) {
            dispatch({ type: 'SET_MESSAGES', payload: { roomId: state.activeRoom.id, messages: cachedMessages } })
          }
        }
        toast.error('Conexión perdida. Usando mensajes en caché...')
      } else if (isConnected && !isReconnecting) {
        toast.success('Conexión restablecida')
      }
    }

    handleConnectionChange()
  }, [isConnected, isReconnecting, lastError])

  // Remover los console.log que causan re-renderizado
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChatProvider mounted')
    }
  }, [])

  const setupRealtime = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    subscribeToChannel('chat_messages', {
      postgres_changes: [{
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${state.activeRoom?.id}`,
        callback: async (payload: any) => {
          try {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message
              dispatch({
                type: 'ADD_MESSAGE',
                payload: { roomId: state.activeRoom?.id, message: newMessage }
              })
              
              const attachments = await getMessageAttachments(newMessage.id)
              if (attachments.length > 0) {
                dispatch({
                  type: 'SET_ATTACHMENTS',
                  payload: { messageId: newMessage.id, attachments }
                })
              }
            } else if (payload.eventType === 'UPDATE') {
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: { roomId: state.activeRoom?.id, message: payload.new as Message }
              })
            } else if (payload.eventType === 'DELETE') {
              dispatch({
                type: 'DELETE_MESSAGE',
                payload: { roomId: state.activeRoom?.id, messageId: payload.old.id }
              })
            }
          } catch (error) {
            console.error('Error processing message change:', error)
            toast.error('Error al procesar cambios en mensajes')
          }
        }
      }]
    })

    // Suscripción unificada para eventos de presence
    subscribeToChannel('typing_users', {
      presence: [{
        event: 'sync',
        callback: () => {
          // Manejar sincronización inicial
        }
      }, {
        event: 'join',
        callback: (payload: any) => {
          if (payload.newPresences) {
            payload.newPresences.forEach((presence: any) => {
              dispatch({
                type: 'SET_TYPING_USER',
                payload: { roomId: state.activeRoom?.id, userId: presence.user_id }
              })
            })
          }
        }
      }, {
        event: 'leave',
        callback: (payload: any) => {
          if (payload.leftPresences) {
            payload.leftPresences.forEach((presence: any) => {
              dispatch({
                type: 'REMOVE_TYPING_USER',
                payload: { roomId: state.activeRoom?.id, userId: presence.user_id }
              })
            })
          }
        }
      }]
    })
  }, [supabase, state.activeRoom?.id, subscribeToChannel])

  const handleError = useCallback((error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    dispatch({ 
      type: 'SET_ERROR', 
      payload: `Error in ${context}: ${error.message}` 
    });
    toast.error(`Error: ${error.message}`);
  }, []);

  const handleConnectionChange = useCallback(() => {
    let reconnectionAttempts = 0;
    let reconnectionTimer: NodeJS.Timeout;

    const attemptReconnection = async () => {
      if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        dispatch({
          type: 'SET_CONNECTION_STATE',
          payload: {
            isConnected: false,
            isReconnecting: false,
            lastError: 'Max reconnection attempts reached'
          }
        });
        toast.error('Unable to reconnect to chat. Please refresh the page.');
        return;
      }

      try {
        dispatch({
          type: 'SET_CONNECTION_STATE',
          payload: {
            isConnected: false,
            isReconnecting: true,
            lastError: null
          }
        });

        // Attempt to reconnect
        await supabase.removeAllChannels();
        await setupRealtime();

        dispatch({
          type: 'SET_CONNECTION_STATE',
          payload: {
            isConnected: true,
            isReconnecting: false,
            lastError: null
          }
        });
        
        toast.success('Reconnected to chat successfully');
        reconnectionAttempts = 0;
      } catch (error) {
        reconnectionAttempts++;
        reconnectionTimer = setTimeout(attemptReconnection, RECONNECTION_TIMEOUT);
      }
    };

    return {
      onOpen: () => {
        dispatch({
          type: 'SET_CONNECTION_STATE',
          payload: {
            isConnected: true,
            isReconnecting: false,
            lastError: null
          }
        });
      },
      onClose: () => {
        dispatch({
          type: 'SET_CONNECTION_STATE',
          payload: {
            isConnected: false,
            isReconnecting: true,
            lastError: 'Connection lost'
          }
        });
        reconnectionTimer = setTimeout(attemptReconnection, RECONNECTION_TIMEOUT);
      },
      onError: (error: Error) => {
        handleError(error, 'websocket connection');
        reconnectionTimer = setTimeout(attemptReconnection, RECONNECTION_TIMEOUT);
      }
    };
  }, [supabase, setupRealtime]);

  const sendMessage = async (
    content: string,
    parentId?: string,
    files?: File[],
    onUploadProgress?: (fileName: string, progress: number) => void
  ) => {
    try {
      if (!state.activeRoom) {
        throw new Error('No active chat room selected');
      }

      if (!content.trim() && (!files || files.length === 0)) {
        throw new Error('Message cannot be empty');
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      const { data: authData } = await supabase.auth.getUser()
      
      if (!authData.user) throw new Error('No authenticated user')

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', authData.user.id)
        .single()

      if (!userData?.organization_id) throw new Error('No organization found')

      // Insertar mensaje
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: state.activeRoom.id,
          user_id: authData.user.id,
          organization_id: userData.organization_id,
          content,
          type: 'text',
          parent_id: parentId
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Subir archivos
      if (files && files.length > 0) {
        try {
          const uploadedFiles = await fileService.uploadFiles(
            files,
            userData.organization_id,
            onUploadProgress
          )
          
          const attachments: MessageAttachment[] = uploadedFiles.map(file => ({
            id: crypto.randomUUID(),
            organization_id: userData.organization_id,
            message_id: message.id,
            file_url: file.url,
            file_type: file.type,
            file_name: file.name,
            file_size: file.size,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { error: attachmentsError } = await supabase
            .from('chat_message_attachments')
            .insert(attachments)

          if (attachmentsError) throw attachmentsError

          dispatch({
            type: 'SET_ATTACHMENTS',
            payload: { messageId: message.id, attachments }
          })
        } catch (error) {
          console.error('Error uploading files:', error)
          toast.error('Error al subir archivos')
        }
      }

      if (parentId) {
        dispatch({ type: 'SET_REPLYING_TO', payload: null })
      }
    } catch (error) {
      handleError(error as Error, 'sending message');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const editMessage = async (messageId: string, content: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content,
          is_edited: true
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      handleError(error as Error, 'editing message');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Eliminar archivos adjuntos primero
      const attachments = state.attachments[messageId] || []
      for (const attachment of attachments) {
        if (attachment.file_type === 'image') {
          await fileService.deleteFile(attachment.file_url)
        }
      }
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      handleError(error as Error, 'deleting message');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const joinRoom = async (roomId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const { data: authData } = await supabase.auth.getUser()
      
      if (!authData.user) throw new Error('No authenticated user')

      // Limpiar el caché al unirse a una nueva sala
      getMessages(roomId)

      // Obtener información de la sala
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      // Unirse a la sala
      const { error: memberError } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: roomId,
          user_id: authData.user.id,
          role: 'member'
        })

      if (memberError) throw memberError

      dispatch({ type: 'SET_ACTIVE_ROOM', payload: room })

      // Resetear estado de paginación
      dispatch({
        type: 'SET_PAGINATION',
        payload: {
          hasMore: true,
          isLoadingMore: false,
          lastMessageTimestamp: null
        }
      })

      // Cargar mensajes iniciales
      await loadMessages(roomId)

      // Cargar miembros de la sala
      const { data: members, error: membersError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)

      if (membersError) throw membersError

      dispatch({ type: 'SET_MEMBERS', payload: { roomId: room.id, members } })

      // Configurar suscripciones en tiempo real
      setupRealtime()
    } catch (error) {
      console.error('Error joining room:', error)
      toast.error('Error al unirse a la sala')
      dispatch({ type: 'SET_ERROR', payload: 'Error joining room' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const leaveRoom = async (roomId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const { data: authData } = await supabase.auth.getUser()
      
      if (!authData.user) throw new Error('No authenticated user')

      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .match({ room_id: roomId, user_id: authData.user.id })

      if (error) throw error

      if (state.activeRoom?.id === roomId) {
        dispatch({ type: 'SET_ACTIVE_ROOM', payload: null })
        dispatch({ type: 'SET_MESSAGES', payload: { roomId: roomId, messages: [] } })
        dispatch({ type: 'SET_MEMBERS', payload: { roomId: roomId, members: [] } })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error leaving room' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const createRoom = async (name: string, memberIds: string[]) => {
    try {
      if (!user) throw new Error('No user authenticated')
      
      // Validar que el usuario sea enterprise
      if (user.role !== 'enterprise') {
        throw new Error('Solo usuarios enterprise pueden crear chats')
      }

      // Validar que los miembros sean admins del mismo hospital
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, role, organization_id')
        .in('id', memberIds)
        .eq('role', 'admin')
        .eq('organization_id', user.organization_id)

      if (membersError) throw membersError
      if (!members || members.length !== memberIds.length) {
        throw new Error('Solo puedes crear chats con admins de tu hospital')
      }

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          organization_id: user.organization_id,
          type: 'direct',
          created_by: user.id,
          is_private: true
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Agregar miembros al chat con organization_id
      const roomMembers = [
        { 
          room_id: room.id, 
          user_id: user.id, 
          role: 'owner',
          organization_id: user.organization_id,
          status: 'active'
        },
        ...memberIds.map(id => ({
          room_id: room.id,
          user_id: id,
          role: 'member',
          organization_id: user.organization_id,
          status: 'active'
        }))
      ]

      const { error: membersInsertError } = await supabase
        .from('chat_room_members')
        .insert(roomMembers)

      if (membersInsertError) throw membersInsertError

      dispatch({ type: 'SET_ACTIVE_ROOM', payload: { ...room, members: [user.id, ...memberIds] } })
      
      toast.success('Chat creado exitosamente')
    } catch (error: any) {
      console.error('Error creating room:', error)
      toast.error(error.message || 'Error al crear el chat')
    }
  }

  const setTyping = async (isTyping: boolean) => {
    if (!state.activeRoom) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const channel = supabase.channel('typing_users')
    
    if (isTyping) {
      await channel.track({
        user_id: session.user.id,
        username: session.user.email
      })
    } else {
      await channel.untrack()
    }
  }

  const setReplyingTo = (message: Message | null) => {
    dispatch({ type: 'SET_REPLYING_TO', payload: message })
  }

  const getMessageAttachments = async (messageId: string): Promise<MessageAttachment[]> => {
    try {
      const { data, error } = await supabase
        .from('chat_message_attachments')
        .select('*')
        .eq('message_id', messageId)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching message attachments:', error)
      return []
    }
  }

  const loadMessages = async (roomId: string, limit: number = 50) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // Intentar cargar mensajes del caché primero
      const cachedMessages = getMessages(roomId)
      if (cachedMessages.length > 0) {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId: roomId, messages: cachedMessages } })
      }

      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (state.pagination.lastMessageTimestamp) {
        query.lt('created_at', state.pagination.lastMessageTimestamp)
      }

      const { data: messages, error } = await query

      if (error) throw error

      if (messages) {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId: roomId, messages } })
        
        // Cargar archivos adjuntos para los nuevos mensajes
        for (const message of messages) {
          const attachments = await getMessageAttachments(message.id)
          if (attachments.length > 0) {
            dispatch({
              type: 'SET_ATTACHMENTS',
              payload: { messageId: message.id, attachments }
            })
          }
        }

        // Actualizar el caché con los nuevos mensajes
        setMessages(roomId, messages)

        // Actualizar estado de paginación
        dispatch({
          type: 'SET_PAGINATION',
          payload: {
            hasMore: messages.length === limit,
            isLoadingMore: false,
            lastMessageTimestamp: messages[messages.length - 1]?.created_at || null
          }
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Error al cargar mensajes')
      dispatch({ type: 'SET_ERROR', payload: 'Error loading messages' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const handleMessages = useCallback((messages: Message[]) => {
    if (!state.activeRoom?.id) return
    dispatch({
      type: 'SET_MESSAGES',
      payload: { roomId: state.activeRoom.id, messages }
    })
  }, [state.activeRoom])

  const setupRealtimeSubscriptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Subscribe to chat rooms
      const roomsChannel = supabase
        .channel(`rooms:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_rooms',
            filter: `organization_id=eq.${user.organization_id}`
          },
          async (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            if (eventType === 'INSERT') {
              dispatch({ type: 'SET_ROOMS', payload: [...state.rooms, newRecord as Room] });
            } else if (eventType === 'UPDATE') {
              const updatedRooms = state.rooms.map(room => 
                room.id === newRecord.id ? { ...room, ...newRecord } : room
              );
              dispatch({ type: 'SET_ROOMS', payload: updatedRooms });
            } else if (eventType === 'DELETE') {
              const filteredRooms = state.rooms.filter(room => room.id !== oldRecord.id);
              dispatch({ type: 'SET_ROOMS', payload: filteredRooms });
            }
          }
        )
        .subscribe();

      // Subscribe to messages in active room
      if (state.activeRoom?.id) {
        const messagesChannel = supabase
          .channel(`messages:${state.activeRoom.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_messages',
              filter: `room_id=eq.${state.activeRoom.id}`
            },
            async (payload) => {
              const { eventType, new: newRecord, old: oldRecord } = payload;
              
              if (eventType === 'INSERT') {
                dispatch({
                  type: 'ADD_MESSAGE',
                  payload: {
                    roomId: state.activeRoom?.id,
                    message: newRecord as Message
                  }
                });
              } else if (eventType === 'UPDATE') {
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: {
                    roomId: state.activeRoom?.id,
                    message: newRecord as Message
                  }
                });
              } else if (eventType === 'DELETE') {
                dispatch({
                  type: 'DELETE_MESSAGE',
                  payload: {
                    roomId: state.activeRoom?.id,
                    messageId: oldRecord.id
                  }
                });
              }
            }
          )
          .subscribe();

        return () => {
          roomsChannel.unsubscribe();
          messagesChannel.unsubscribe();
        };
      }

      return () => {
        roomsChannel.unsubscribe();
      };
    } catch (error) {
      handleError(error as Error, 'setting up realtime subscriptions');
    }
  }, [user?.id, user?.organization_id, state.activeRoom?.id, state.rooms]);

  // Add setupRealtimeSubscriptions to useEffect
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const setup = async () => {
      cleanup = await setupRealtimeSubscriptions();
    };
    
    setup();
    
    return () => {
      cleanup?.();
    };
  }, [setupRealtimeSubscriptions]);

  const value = useMemo(() => ({
    state,
    dispatch,
    sendMessage,
    editMessage,
    deleteMessage,
    joinRoom,
    leaveRoom,
    createRoom,
    setTyping,
    setReplyingTo,
    getMessageAttachments,
    loadMessages
  }), [state, dispatch, sendMessage, editMessage, deleteMessage, joinRoom, leaveRoom, createRoom, setTyping, setReplyingTo, getMessageAttachments, loadMessages])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
} 