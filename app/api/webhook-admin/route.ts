import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Obtener todas las configuraciones de webhook
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

// Crear nueva configuración de webhook
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data, error } = await supabase
    .from('webhook_configs')
    .insert([{
      event_type: body.event_type,
      endpoint_url: body.endpoint_url,
      secret_key: body.secret_key || `secret_key_${body.event_type}_${Date.now()}`,
      is_active: body.is_active ?? true,
      retry_count: body.retry_count || 3
    }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

// Actualizar configuración de webhook
export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id, ...updates } = await request.json()

  const { data, error } = await supabase
    .from('webhook_configs')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

// Eliminar configuración de webhook
export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = await request.json()

  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 