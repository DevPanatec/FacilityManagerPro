'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { RoomMember } from '@/app/shared/contexts/ChatContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

interface MentionSuggestionsProps {
  query: string
  members: RoomMember[]
  position: { top: number; left: number }
  onSelect: (member: RoomMember) => void
  onClose: () => void
}

interface UserWithAvatar {
  id: string
  avatar_url: string | null
}

export default function MentionSuggestions({
  query,
  members,
  position,
  onSelect,
  onClose
}: MentionSuggestionsProps) {
  const [filteredMembers, setFilteredMembers] = useState<RoomMember[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [userAvatars, setUserAvatars] = useState<Record<string, string | null>>({})
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Cargar avatares de usuarios
    const loadUserAvatars = async () => {
      const userIds = members.map(member => member.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', userIds)

      if (users) {
        const avatarMap = users.reduce((acc, user) => ({
          ...acc,
          [user.id]: user.avatar_url
        }), {} as Record<string, string | null>)
        setUserAvatars(avatarMap)
      }
    }

    loadUserAvatars()
  }, [members, supabase])

  useEffect(() => {
    // Filtrar miembros basado en la consulta
    const filtered = members.filter(member =>
      member.user_id.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredMembers(filtered)
    setSelectedIndex(0)
  }, [query, members])

  useEffect(() => {
    // Cerrar las sugerencias al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.mention-suggestions')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!filteredMembers.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredMembers.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        break
      case 'Enter':
        e.preventDefault()
        onSelect(filteredMembers[selectedIndex])
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredMembers, selectedIndex, onSelect, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!filteredMembers.length) return null

  return createPortal(
    <div
      className="mention-suggestions fixed z-50 bg-base-100 rounded-lg shadow-xl border p-2 w-64 max-h-60 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filteredMembers.map((member, index) => (
        <button
          key={member.user_id}
          onClick={() => onSelect(member)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            index === selectedIndex
              ? 'bg-primary text-primary-content'
              : 'hover:bg-base-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {userAvatars[member.user_id] ? (
              <img
                src={userAvatars[member.user_id]!}
                alt={member.user_id}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {member.user_id.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{member.user_id}</span>
          </div>
        </button>
      ))}
    </div>,
    document.body
  )
} 