import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { position } = body

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update({ position })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar widget'
    const status = error instanceof Error && errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
} 