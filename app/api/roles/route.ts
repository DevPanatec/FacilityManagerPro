import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RESOURCES, ACTIONS } from '../../../lib/types/permissions'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')

    if (error) throw error

    return NextResponse.json(roles)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener roles';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar permisos
    const permissions = body.permissions || []
    const validPermissions = permissions.every((p: any) => 
      RESOURCES[p.resource as keyof typeof RESOURCES] &&
      ACTIONS[p.action as keyof typeof ACTIONS]
    )

    if (!validPermissions) {
      throw new Error('Permisos inválidos')
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear rol';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 
