import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'

    if (!token_hash || !type) {
      return NextResponse.redirect(new URL('/auth/error?message=Parámetros inválidos', request.url))
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('Error al verificar email:', error)
    return NextResponse.redirect(
      new URL('/auth/error?message=Error al verificar el email', request.url)
    )
  }
} 