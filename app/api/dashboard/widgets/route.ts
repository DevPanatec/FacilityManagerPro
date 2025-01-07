import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { DashboardWidget } from '../../../../lib/types/dashboard'

// GET /api/dashboard/widgets - Obtener widgets
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: widgets, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json(widgets)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener widgets';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/dashboard/widgets - Crear widget
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json() as DashboardWidget
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert([
        {
          ...body,
          user_id: user.id
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear widget';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
