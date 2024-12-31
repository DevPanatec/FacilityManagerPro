import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { DashboardLayout } from '@/lib/types/dashboard'

// GET /api/dashboard/layouts - Obtener layouts
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: layouts, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(layouts)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/dashboard/layouts - Guardar layout
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { layout, name, is_default } = body

    // Si es default, quitar default de otros layouts
    if (is_default) {
      await supabase
        .from('dashboard_layouts')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        user_id: user.id,
        name,
        layout,
        is_default
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 