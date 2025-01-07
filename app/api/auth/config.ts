import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1m'),
  analytics: true,
}) 
