import { NextResponse } from 'next/server'
import { PermissionService } from '../lib/services/permissions'

export async function authMiddleware(
  request: Request,
  resource: Resource,
  action: Action
) {
  const permissionService = new PermissionService()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401 }
    )
  }

  // Verificar permisos
  const hasPermission = await permissionService.hasPermission(
    user.id,
    resource,
    action
  )

  if (!hasPermission) {
    return new NextResponse(
      JSON.stringify({ error: 'No tiene permisos suficientes' }),
      { status: 403 }
    )
  }

  return NextResponse.next()
} 