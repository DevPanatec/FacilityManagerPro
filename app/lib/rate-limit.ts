import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter, that allows 5 requests per minute
export const authRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})

// Create a new ratelimiter for API endpoints
export const apiRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit = authRateLimiter
) {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier)
    return {
      success,
      limit,
      reset,
      remaining,
      error: null
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    return {
      success: false,
      limit: 0,
      reset: 0,
      remaining: 0,
      error
    }
  }
} 