import { Redis } from '@upstash/redis';
import { RateLimiter } from 'limiter';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!
});

type RateLimitConfig = {
  endpoint: string;
  limit: number;
  window: number; // en segundos
  userRole?: string;
};

const rateLimitConfigs: RateLimitConfig[] = [
  { endpoint: '/api/webhook-admin', limit: 100, window: 3600, userRole: 'admin' },
  { endpoint: '/api/reports', limit: 1000, window: 3600 },
  { endpoint: '/api/auth/*', limit: 5, window: 300 } // límite para intentos de login
];

export async function checkRateLimit(
  endpoint: string,
  userRole: string,
  identifier: string
): Promise<boolean> {
  const config = rateLimitConfigs.find(c => 
    endpoint.startsWith(c.endpoint) && 
    (!c.userRole || c.userRole === userRole)
  );

  if (!config) return true;

  const key = `ratelimit:${endpoint}:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, config.window);
  }

  return current <= config.limit;
} 