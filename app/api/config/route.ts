import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { errorHandler } from '@/utils/errorHandler'
import { validator } from '@/utils/validation'

export const dynamic = 'force-dynamic'

// GET configuración del sistema
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Obtener configuración
    const { data: config, error } = await supabase
      .from('system_config')
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json(config)
  } catch (error) {
    return errorHandler.handle(error)
  }
}

// POST actualizar configuración
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Verificar autenticación y rol admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: adminCheck } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminCheck || !['admin', 'superadmin'].includes(adminCheck.role)) {
      throw new Error('No autorizado - Se requiere rol de administrador')
    }

    // Validar configuración
    const validConfig = validator.validateConfig(body)

    // Actualizar configuración
    const { data, error } = await supabase
      .from('system_config')
      .upsert([validConfig])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return errorHandler.handle(error)
  }
} 