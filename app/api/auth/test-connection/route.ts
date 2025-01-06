import { createClient } from '@/utils/supabase/config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Prueba básica de conexión
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión a Supabase exitosa',
      data
    })
  } catch (error: any) {
    console.error('Error al probar la conexión con Supabase:', error.message)
    return NextResponse.json({ 
      success: false,
      message: error.message
    }, { status: 500 })
  }
} 