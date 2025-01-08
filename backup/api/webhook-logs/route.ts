import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const url = new URL(request.url)
  const event_type = url.searchParams.get('event_type')
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  
  let query = supabase
    .from('webhook_logs')
    .select(`
      *,
      webhook_configs (
        event_type,
        endpoint_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (event_type) {
    query = query.eq('event_type', event_type)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
} 