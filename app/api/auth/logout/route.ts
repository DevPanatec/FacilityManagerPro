import { NextResponse } from 'next/server'
import { createClient } from '@/app/config/supabaseServer'

export async function POST() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return NextResponse.json({ message: 'Sesión cerrada correctamente' })
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
} 