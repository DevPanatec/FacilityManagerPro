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
  } catch (error) {
    console.error('Error fetching contingencies:', error)
    return NextResponse.json(
      { error: 'Error fetching contingencies' },
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
  } catch (error) {
    console.error('Error creating contingency:', error)
    return NextResponse.json(
      { error: 'Error creating contingency' },
      { status: 500 }
    )
  }
} 