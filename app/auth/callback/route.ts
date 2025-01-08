import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // Get the next URL from the search params or default to dashboard
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(new URL(next, requestUrl))
} 
