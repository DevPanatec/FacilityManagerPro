import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase
      .from('contingencies')
      .select('*')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error fetching contingencies'
    
    console.error('Error fetching contingencies:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase
      .from('contingencies')
      .insert(body)
      .select()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error creating contingency';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    
    console.error('Error creating contingency:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 