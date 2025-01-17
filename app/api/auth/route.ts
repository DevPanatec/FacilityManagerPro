import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        role: userData.role,
        email: session.user.email
      }
    })

  } catch (error) {
    console.error('Error en verificación de permisos:', error)
    return NextResponse.json(
      { error: 'Error al verificar permisos' },
      { status: 500 }
    )
  }
} 