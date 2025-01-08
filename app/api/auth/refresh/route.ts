import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    if (!session) {
      return NextResponse.json(
        { error: 'No hay sesión activa' },
        { status: 401 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error al refrescar la sesión:', error)
    return NextResponse.json(
      { error: 'Error al refrescar la sesión' },
      { status: 500 }
    )
  }
} 