import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
  limit: number
}

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
        return { success: true };
      }
      
      if (tokenCount[0] === options?.limit) {
        return { 
          success: false,
          limit: options?.limit,
          remaining: 0,
          reset: tokenCache.getRemainingTTL(token)
        };
      }

      tokenCount[0] += 1;
      tokenCache.set(token, tokenCount);
      
      return {
        success: true,
        limit: options?.limit,
        remaining: options?.limit - tokenCount[0],
        reset: tokenCache.getRemainingTTL(token)
      };
    },
  };
} 