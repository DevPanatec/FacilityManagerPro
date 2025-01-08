import { createRouteHandlerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient()

  const { data: widget, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

  return NextResponse.json(widget)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient()
  const updates = await request.json()

  const { data: widget, error } = await supabase
    .from('dashboard_widgets')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
  }

  return NextResponse.json(widget)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient()

  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Widget deleted successfully' })
} 