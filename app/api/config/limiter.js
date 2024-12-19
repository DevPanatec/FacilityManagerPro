import { rateLimit } from '@/lib/rate-limit'

export const rateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
  limit: 10, // 10 requests por minuto
}) 