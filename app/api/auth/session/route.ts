import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    return NextResponse.json(
      { error: 'Error al obtener sesión' },
      { status: 500 }
    )
  }
} 