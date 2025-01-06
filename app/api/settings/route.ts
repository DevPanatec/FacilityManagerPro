import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase
      .from('settings')
      .select('*')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error fetching settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error fetching settings';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase
      .from('settings')
      .upsert(body)
      .select()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error updating settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error updating settings';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 