import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    // Procesar el webhook
    const { data, error } = await supabase
      .from('webhooks')
      .insert(body)
      .select()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error('Error processing webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error processing webhook';
    const statusCode = 500;
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error fetching webhooks:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error fetching webhooks';
    const statusCode = 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
