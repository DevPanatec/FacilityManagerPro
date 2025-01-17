import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, userId, organizationId } = body

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    }

    // Establecer las cookies de sesión
    const cookieStore = cookies()
    cookieStore.set('userRole', role, cookieOptions)
    cookieStore.set('userId', userId, cookieOptions)
    cookieStore.set('isAuthenticated', 'true', cookieOptions)
    
    if (organizationId) {
      cookieStore.set('organizationId', organizationId, cookieOptions)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al establecer la sesión:', error)
    return NextResponse.json(
      { error: 'Error al establecer la sesión' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const cookieStore = cookies()
  const userRole = cookieStore.get('userRole')
  const isAuthenticated = cookieStore.get('isAuthenticated')
  const userId = cookieStore.get('userId')
  const organizationId = cookieStore.get('organizationId')

  return NextResponse.json({
    userRole: userRole?.value,
    isAuthenticated: isAuthenticated?.value === 'true',
    userId: userId?.value,
    organizationId: organizationId?.value
  })
} 