'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  position: { top: number; left: number }
}

interface EmojiCategory {
  name: string
  emojis: string[]
}

const emojiCategories: Record<string, EmojiCategory> = {
  recent: {
    name: 'Recientes',
    emojis: [] // Se llenará con los emojis usados recientemente
  },
  smileys: {
    name: 'Caras',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘']
  },
  gestures: {
    name: 'Gestos',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '👊', '✊', '🤛', '🤜', '🤚', '👋', '🤟', '✋', '👐', '🙌', '👏']
  },
  hearts: {
    name: 'Corazones',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖']
  },
  objects: {
    name: 'Objetos',
    emojis: ['🎉', '🎊', '🎈', '🎂', '🎁', '📱', '💻', '⌚️', '📷', '🎮', '🎧', '🎵', '🎶', '⚽️', '🏀', '🎯']
  }
}

const MAX_RECENT_EMOJIS = 16

export default function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('smileys')
  const [searchTerm, setSearchTerm] = useState('')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])

  useEffect(() => {
    // Cargar emojis recientes del localStorage
    const stored = localStorage.getItem('recentEmojis')
    if (stored) {
      setRecentEmojis(JSON.parse(stored))
      emojiCategories.recent.emojis = JSON.parse(stored)
    }

    // Cerrar el picker al hacer clic fuera
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.emoji-picker')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleEmojiSelect = useCallback((emoji: string) => {
    onSelect(emoji)
    
    // Actualizar emojis recientes
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)]
      .slice(0, MAX_RECENT_EMOJIS)
    
    setRecentEmojis(newRecent)
    emojiCategories.recent.emojis = newRecent
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent))
  }, [onSelect, recentEmojis])

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => emoji.includes(searchTerm))
    : emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis

  return createPortal(
    <div
      className="emoji-picker fixed z-50 bg-base-100 rounded-lg shadow-xl border p-4 w-72"
      style={{ top: position.top, left: position.left }}
    >
      {/* Barra de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Categorías */}
      {!searchTerm && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {Object.entries(emojiCategories).map(([key, { name }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === key
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 hover:bg-base-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Grid de emojis */}
      <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center hover:bg-base-200 rounded transition-colors text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
} 