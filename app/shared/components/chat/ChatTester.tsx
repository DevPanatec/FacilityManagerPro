'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/app/shared/hooks/useUser'
import { useChatContext } from '@/app/shared/contexts/ChatContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

export function ChatTester() {
  const { user, loading: userLoading } = useUser()
  const { state, joinRoom } = useChatContext()
  const [admins, setAdmins] = useState<any[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadAdmins = async () => {
      if (!user?.organization_id) return

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('organization_id', user.organization_id)
        .eq('role', 'admin')

      if (error) {
        console.error('Error loading admins:', error)
        toast.error('Error al cargar administradores')
        return
      }

      setAdmins(data || [])
    }

    loadAdmins()
  }, [user?.organization_id, supabase])

  const handleCreateChat = async () => {
    if (!selectedAdmin || !user) {
      toast.error('Selecciona un administrador')
      return
    }

    try {
      console.log('Creating chat with:', {
        target_user_id: selectedAdmin,
        organization_id: user.organization_id
      })

      // Crear sala de chat usando la función RPC
      const { data: roomId, error: createError } = await supabase
        .rpc('create_direct_chat', {
          target_user_id: selectedAdmin,
          organization_id: user.organization_id
        })

      console.log('Create chat response:', { roomId, error: createError })

      if (createError) throw createError

      // Unirse a la sala creada
      if (roomId) {
        await joinRoom(roomId)
        toast.success('Chat creado y unido exitosamente')
      }
    } catch (error: any) {
      console.error('Error creating chat:', error)
      toast.error(error.message || 'Error al crear el chat')
    }
  }

  if (userLoading) {
    return <div>Cargando...</div>
  }

  if (!user) {
    return <div>No hay usuario autenticado</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Información del Usuario</h2>
        <div className="space-y-2">
          <p>ID: {user.id}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>Organization ID: {user.organization_id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Crear Chat Directo</h2>
        <div className="space-y-4">
          <select
            value={selectedAdmin || ''}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Selecciona un administrador</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email} ({admin.role})
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateChat}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Crear Chat
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Estado del Chat</h2>
        <div className="space-y-2">
          <p>Conectado: {state.connectionState.isConnected ? 'Sí' : 'No'}</p>
          <p>Reconectando: {state.connectionState.isReconnecting ? 'Sí' : 'No'}</p>
          {state.connectionState.lastError && (
            <p className="text-red-500">Error: {state.connectionState.lastError}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Chats Activos</h2>
        <div className="space-y-2">
          {state.rooms.length > 0 ? (
            state.rooms.map((room) => (
              <div
                key={room.id}
                className="p-2 border rounded dark:border-gray-600"
              >
                <p>ID: {room.id}</p>
                <p>Nombre: {room.name}</p>
                <p>Tipo: {room.type}</p>
              </div>
            ))
          ) : (
            <p>No hay chats activos</p>
          )}
        </div>
      </div>
    </div>
  )
} 