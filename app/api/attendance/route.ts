import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del usuario' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { userId, type, location } = await request.json()

    if (!userId || !type || !location) {
      return NextResponse.json(
        { error: 'Se requieren todos los campos' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          user_id: userId,
          type,
          location
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al registrar asistencia:', error)
    return NextResponse.json(
      { error: 'Error al registrar asistencia' },
      { status: 500 }
    )
  }
} 