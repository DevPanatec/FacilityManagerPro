import { headers } from 'next/headers'
import { LRUCache } from 'lru-cache'

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60 * 1000 // 1 minute
})

export async function getRateLimit(ip: string) {
  const tokenCount = rateLimit.get(ip) || [0]
  const currentTime = Date.now()
  const windowSize = 60 * 1000 // 1 minute

  if (tokenCount[0] > 100) { // 100 requests per minute
    return {
      allowed: false,
      remaining: 0,
      reset: currentTime + windowSize
    }
  }

  rateLimit.set(ip, tokenCount[0] + 1)

  return {
    allowed: true,
    remaining: 100 - tokenCount[0],
    reset: currentTime + windowSize
  }
} 
