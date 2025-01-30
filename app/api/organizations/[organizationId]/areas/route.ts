import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { organizationId } = params

    // Obtener áreas de la organización
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('name')

    if (areasError) {
      console.error('Error al obtener áreas:', areasError)
      return NextResponse.json(
        { error: 'Error al obtener las áreas' },
        { status: 500 }
      )
    }

    return NextResponse.json(areas)

  } catch (error) {
    console.error('Error al obtener áreas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 