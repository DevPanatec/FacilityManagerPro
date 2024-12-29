import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/logs - Obtener logs de actividad/auditoría
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'activity'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const { data, error } = await supabase
      .from(type === 'audit' ? 'audit_logs' : 'activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/logs - Registrar nuevo log
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 