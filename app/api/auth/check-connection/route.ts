import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mostrar las variables de entorno (sin mostrar las claves completas por seguridad)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    // Intentar crear el cliente
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('profiles')
      .select('count()', { count: 'exact', head: true })

    return NextResponse.json({
      connection: {
        url: supabaseUrl,
        hasAnonKey,
        hasServiceKey
      },
      test: {
        success: !error,
        error: error?.message,
        count: data
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 