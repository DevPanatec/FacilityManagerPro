import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter that allows 5 requests per minute
export const getRateLimit = async (identifier: string) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1m'),
    analytics: true,
    prefix: '@upstash/ratelimit',
    ephemeralCache: new Map(),
  })

  return await ratelimit.limit(identifier || 'anonymous')
} 