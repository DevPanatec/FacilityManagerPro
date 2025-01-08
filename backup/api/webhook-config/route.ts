import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { event_type, endpoint_url, secret_key } = await request.json()

  const { data, error } = await supabase
    .from('webhook_configs')
    .insert([
      {
        event_type,
        endpoint_url,
        secret_key,
        is_active: true,
        retry_count: 3
      }
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
} 