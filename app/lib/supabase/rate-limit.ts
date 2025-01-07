import type { NextRequest } from 'next/server'

interface RateLimitResponse {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting
const ipMap = new Map<string, { count: number; timestamp: number }>()

// Rate limit configuration
const RATE_LIMIT = {
  window: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of ipMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT.window) {
      ipMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export async function rateLimit(
  request: NextRequest
): Promise<RateLimitResponse> {
  const ip = request.ip ?? 
    request.headers.get('x-forwarded-for') ?? 
    'unknown'
  
  const now = Date.now()
  const windowStart = now - RATE_LIMIT.window

  // Get existing record
  const record = ipMap.get(ip)
  
  // If no record or record is expired
  if (!record || record.timestamp < windowStart) {
    ipMap.set(ip, { count: 1, timestamp: now })
    return {
      success: true,
      limit: RATE_LIMIT.max,
      remaining: RATE_LIMIT.max - 1,
      reset: now + RATE_LIMIT.window
    }
  }

  // Update existing record
  const newCount = record.count + 1
  ipMap.set(ip, { count: newCount, timestamp: record.timestamp })

  // Check if over limit
  if (newCount > RATE_LIMIT.max) {
    return {
      success: false,
      limit: RATE_LIMIT.max,
      remaining: 0,
      reset: record.timestamp + RATE_LIMIT.window
    }
  }

  return {
    success: true,
    limit: RATE_LIMIT.max,
    remaining: RATE_LIMIT.max - newCount,
    reset: record.timestamp + RATE_LIMIT.window
  }
} 
