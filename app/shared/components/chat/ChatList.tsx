'use client'

import { memo, useState, useEffect } from 'react'
import { useChatContext } from '@/app/shared/contexts/ChatContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { useUser } from '@/app/shared/hooks/useUser'
import { ChatConnectionStatus } from './ChatConnectionStatus'
import { ChatMessageTester } from './ChatMessageTester'

interface Admin {
  id: string
  email: string
  avatar_url: string | null
}

interface ChatRoom {
  id: string
  organization_id: string
  name: string
  type: string
  description: string | null
  created_by: string
  is_private: boolean
  created_at: string
  updated_at: string
}

interface ChatRoomMember {
  user_id: string
  room_id: string
  role: string
}

const ChatList = memo(function ChatList() {
  const { state, dispatch, joinRoom } = useChatContext()
  const { user } = useUser()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [showAdminList, setShowAdminList] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        if (!user) {
          console.log('No hay usuario autenticado')
          return
        }

        console.log('Cargando admins para organization:', user.organization_id)

        // Obtener admins
        const { data: adminsData, error: adminsError } = await supabase
          .from('users')
          .select('id, email, avatar_url')
          .eq('role', 'admin')
          .eq('organization_id', user.organization_id)

        if (adminsError) {
          console.error('Error al obtener administradores:', adminsError)
          return
        }

        console.log('Administradores encontrados:', adminsData)

        if (adminsData && adminsData.length > 0) {
          setAdmins(adminsData)
        } else {
          console.log('No se encontraron administradores')
        }
      } catch (error) {
        console.error('Error loading admins:', error)
      }
    }

    if (user) {
      loadAdmins()
    }
  }, [supabase, user])

  const handleAdminSelect = async (admin: Admin) => {
    try {
      if (!user) {
        toast.error('No hay usuario autenticado')
        return
      }

      if (user.role !== 'enterprise') {
        toast.error('Solo usuarios enterprise pueden crear chats')
        return
      }

      console.log('Iniciando creación de chat:', {
        enterprise: user,
        admin: admin,
        organization_id: user.organization_id
      })

      // Crear sala de chat usando la función RPC
      const { data: roomId, error: createError } = await supabase
        .rpc('create_direct_chat', {
          p_organization_id: user.organization_id,
          p_creator_id: user.id,
          p_member_id: admin.id,
          p_chat_name: `Chat con ${admin.email}`
        })

      console.log('Resultado de create_direct_chat:', { roomId, error: createError })

      if (createError) {
        console.error('Error creating chat room:', createError)
        toast.error(`Error al crear la sala de chat: ${createError.message}`)
        return
      }

      if (!roomId) {
        console.error('No room ID returned after creation')
        toast.error('Error: No se pudo crear la sala de chat')
        return
      }

      // Obtener detalles de la sala creada
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      console.log('Detalles de la sala creada:', newRoom)

      if (roomError || !newRoom) {
        console.error('Error getting room details:', roomError)
        toast.error('Error al obtener detalles de la sala')
        return
      }

      // Obtener los miembros actuales de la sala
      const { data: members, error: membersError } = await supabase
        .from('chat_room_members')
        .select('*')
        .eq('room_id', roomId)

      console.log('Miembros de la sala:', members)

      if (membersError) {
        console.error('Error loading members:', membersError)
      }

      // Actualizar el estado global
      const roomWithMembers = {
        ...newRoom,
        members: members ? members.map(m => m.user_id) : [user.id, admin.id]
      }

      dispatch({ type: 'SET_ROOMS', payload: [...state.rooms, roomWithMembers] })
      dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomWithMembers })

      if (members) {
        dispatch({
          type: 'SET_MEMBERS',
          payload: { roomId: newRoom.id, members }
        })
      }

      setShowAdminList(false)
      toast.success('Chat creado exitosamente')

    } catch (error: any) {
      console.error('Error completo en handleAdminSelect:', error)
      toast.error(error.message || 'Error inesperado al crear el chat')
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800">
      <ChatConnectionStatus />
      <div className="p-4 space-y-4">
        <button
          onClick={() => setShowAdminList(true)}
          className="btn btn-primary w-full"
        >
          Iniciar nuevo chat
        </button>

        {showAdminList && (
          <div className="space-y-2">
            <h3 className="font-medium text-lg">Selecciona un administrador</h3>
            {admins.map(admin => (
              <button
                key={admin.id}
                onClick={() => handleAdminSelect(admin)}
                className="btn btn-ghost w-full justify-start gap-2"
              >
                {admin.avatar_url ? (
                  <img
                    src={admin.avatar_url}
                    alt={admin.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content">
                    {admin.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-left truncate">
                  {admin.email}
                </span>
              </button>
            ))}
          </div>
        )}

        {state.rooms.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-medium text-lg">Chats existentes</h3>
            {state.rooms.map(room => (
              <button
                key={room.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_ROOM', payload: room })}
                className={`btn w-full justify-start gap-2 ${
                  state.activeRoom?.id === room.id ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                <span className="flex-1 text-left truncate">{room.name}</span>
                {state.unreadCounts[room.id] > 0 && (
                  <span className="badge badge-primary badge-sm">
                    {state.unreadCounts[room.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-base-content/60">
            No hay chats existentes
          </p>
        )}
      </div>
      {state.activeRoom && <ChatMessageTester />}
    </div>
  )
})

export default ChatList 