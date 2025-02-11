import { createServerSupabaseClient } from '@/app/lib/supabase/config.server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Intentar obtener un registro de la tabla users
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Error al conectar con Supabase:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conexión exitosa con Supabase',
      data 
    })
    
  } catch (error) {
    console.error('Error al probar la conexión:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
} 