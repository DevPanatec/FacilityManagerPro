import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test the connection and check for specific user
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email)
      .single()

    if (authError) {
      console.error('Auth user check error:', authError)
    }

    // Also check the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('User data check error:', userError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
      authUser,
      userData
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    
    console.error('Unexpected error testing Supabase connection:', errorMessage);
    return NextResponse.json({ 
      success: false,
      message: errorMessage
    }, { status: statusCode })
  }
} 