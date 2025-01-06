import { NextResponse } from 'next/server'
import { seedDefaultUsers } from '../../../utils/seedUsers'

export async function GET(request: Request) {
  try {
    console.log('Iniciando proceso de seeding temporal...')
    
    await seedDefaultUsers()

    return NextResponse.json({
      success: true,
      message: 'Usuarios predeterminados creados exitosamente'
    })

  } catch (error) {
    console.error('Error detallado en el seeding de usuarios:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      },
      { status: 500 }
    )
  }
} 