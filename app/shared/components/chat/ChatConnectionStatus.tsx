'use client'

import { useChatContext } from '@/app/shared/contexts/ChatContext'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export function ChatConnectionStatus() {
  const { state } = useChatContext()
  const { connectionState } = state

  useEffect(() => {
    if (connectionState.isReconnecting) {
      toast.loading('Reconnecting to chat...', { id: 'chat-connection' })
    } else if (connectionState.isConnected) {
      toast.success('Connected to chat', { id: 'chat-connection' })
    } else if (connectionState.lastError) {
      toast.error(`Chat connection error: ${connectionState.lastError}`, { id: 'chat-connection' })
    }
  }, [connectionState])

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      <div
        className={`h-2 w-2 rounded-full ${
          connectionState.isConnected
            ? 'bg-green-500'
            : connectionState.isReconnecting
            ? 'bg-yellow-500 animate-pulse'
            : 'bg-red-500'
        }`}
      />
      <span>
        {connectionState.isConnected
          ? 'Connected'
          : connectionState.isReconnecting
          ? 'Reconnecting...'
          : 'Disconnected'}
      </span>
      {connectionState.lastError && (
        <span className="text-red-500 text-xs">{connectionState.lastError}</span>
      )}
    </div>
  )
} 