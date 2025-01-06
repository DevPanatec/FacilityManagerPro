import { NextResponse } from 'next/server'
import { seedDefaultUsers } from '../../../utils/seedUsers'

export async function POST(request: Request) {
  try {
    console.log('Iniciando proceso de seeding...')
    
    // Verificar si la petición tiene el token secreto correcto
    const { headers } = request
    const authToken = headers.get('x-auth-token')
    
    console.log('Token recibido:', authToken)
    console.log('Token esperado:', process.env.SEED_AUTH_TOKEN)

    if (authToken !== process.env.SEED_AUTH_TOKEN) {
      console.log('Token inválido')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('Token válido, procediendo con el seeding...')
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