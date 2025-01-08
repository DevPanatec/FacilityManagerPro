import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getRateLimit } from '@/utils/rate-limit'

export const runtime = 'edge'

export async function GET() {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'
  
  const rateLimit = await getRateLimit(ip)
  
  if (!rateLimit.success) {
    return new NextResponse(JSON.stringify({
      error: 'Too many requests',
      ...rateLimit
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString()
      }
    })
  }

  return new NextResponse(JSON.stringify({
    success: true,
    message: 'API is working correctly',
    rateLimit
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.reset.toString()
    }
  })
} 
