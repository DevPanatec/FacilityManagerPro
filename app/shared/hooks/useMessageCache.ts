import { useCallback } from 'react'
import type { Message } from '@/app/shared/contexts/ChatContext'

const CACHE_PREFIX = 'chat_messages_'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 horas

interface CachedData {
  messages: Message[]
  timestamp: number
}

export function useMessageCache() {
  const getCacheKey = (roomId: string) => `${CACHE_PREFIX}${roomId}`

  const getMessages = useCallback((roomId: string): Message[] => {
    try {
      const cacheKey = getCacheKey(roomId)
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return []

      const { messages, timestamp }: CachedData = JSON.parse(cached)
      
      // Verificar si el caché ha expirado
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(cacheKey)
        return []
      }

      return messages
    } catch (error) {
      console.error('Error reading message cache:', error)
      return []
    }
  }, [])

  const setMessages = useCallback((roomId: string, messages: Message[]) => {
    try {
      const cacheKey = getCacheKey(roomId)
      const cacheData: CachedData = {
        messages,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error writing message cache:', error)
    }
  }, [])

  const clearCache = useCallback((roomId: string) => {
    try {
      const cacheKey = getCacheKey(roomId)
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Error clearing message cache:', error)
    }
  }, [])

  const clearAllCache = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Error clearing all message caches:', error)
    }
  }, [])

  return {
    getMessages,
    setMessages,
    clearCache,
    clearAllCache
  }
} 