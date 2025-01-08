import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al obtener webhooks:', error)
    return NextResponse.json(
      { error: 'Error al obtener webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('webhook_configs')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al crear webhook:', error)
    return NextResponse.json(
      { error: 'Error al crear webhook' },
      { status: 500 }
    )
  }
} 