import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getRateLimit } from '@/utils/rate-limit'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = headers().get('x-forwarded-for') ?? 'unknown'
    const rateLimit = await getRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too Many Requests' 
      }, { 
        status: 429,
        headers: {
          'Retry-After': `${Math.ceil((rateLimit.reset - Date.now()) / 1000)}`,
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': `${rateLimit.remaining}`,
          'X-RateLimit-Reset': `${rateLimit.reset}`
        }
      })
    }

    const supabase = createClient()
    
    const [sessionResponse, databaseResponse] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('users').select('count').single()
    ])

    return NextResponse.json({
      status: 'ok',
      auth: {
        session: sessionResponse.data.session ? 'active' : 'none',
        error: sessionResponse.error?.message,
        provider: sessionResponse.data.session?.user?.app_metadata?.provider
      },
      database: {
        connected: !databaseResponse.error,
        error: databaseResponse.error?.message
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        reset: rateLimit.reset
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 
