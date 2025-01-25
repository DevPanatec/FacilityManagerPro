'use client'

import { memo } from 'react'

interface ChatHeaderProps {
  onClose: () => void
  isAdmin?: boolean
  isAdminPrincipal?: boolean
}

const ChatHeader = memo(function ChatHeader({
  onClose,
  isAdmin = false,
  isAdminPrincipal = false
}: ChatHeaderProps) {
  return (
    <div className="bg-primary text-primary-content p-4 rounded-t-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="card-title text-primary-content">Chat de Soporte</h2>
          {isAdmin && (
            <p className="text-sm opacity-75">
              {isAdminPrincipal ? 'Admin Principal' : 'Admin'}
            </p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="btn btn-circle btn-sm btn-ghost text-primary-content hover:bg-primary-focus"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
})

export default ChatHeader 