import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, defaultMessage: string) {
  const errorMessage = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json(
    { error: errorMessage },
    { status: errorMessage.includes('No autorizado') ? 403 : 500 }
  )
} 
