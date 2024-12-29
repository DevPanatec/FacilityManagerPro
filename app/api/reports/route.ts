import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { WebhookHandler } from '@/lib/webhooks/handler'
import { validateWebhookPayload } from '@/lib/validation'
import { logSecurityEvent } from '@/lib/security'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { z } from 'zod'

// Esquema de validación para reportes
const ReportPayloadSchema = z.object({
  eventType: z.string().min(1),
  payload: z.object({
    reportType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    filters: z.record(z.unknown()).optional(),
    format: z.enum(['PDF', 'CSV', 'EXCEL']).default('PDF')
  })
})

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const session = await supabase.auth.getSession()
    
    // Verificar autenticación
    if (!session.data.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const canProceed = await checkRateLimit('/api/reports', session.data.session.user.role, ip)
    if (!canProceed) {
      await logSecurityEvent('RATE_LIMIT_EXCEEDED', request)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const table = request.url.split('/').pop()
    
    // Verificar permisos para el tipo de reporte
    const hasPermission = await checkReportPermission(
      session.data.session.user.id,
      table!
    )
    
    if (!hasPermission) {
      await logSecurityEvent('UNAUTHORIZED_REPORT_ACCESS', request)
      return NextResponse.json(
        { error: 'Permission denied for this report type' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from(table!)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ data })

  } catch (error: any) {
    console.error('Error processing report request:', error)
    await logSecurityEvent('REPORT_ERROR', request, { error: error.message })
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const session = await supabase.auth.getSession()
    
    // Verificar autenticación
    if (!session.data.session) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS', request)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const canProceed = await checkRateLimit('/api/reports', session.data.session.user.role, ip)
    if (!canProceed) {
      await logSecurityEvent('RATE_LIMIT_EXCEEDED', request)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Validar payload
    const body = await request.json()
    const validationResult = ReportPayloadSchema.safeParse(body)
    
    if (!validationResult.success) {
      await logSecurityEvent('INVALID_PAYLOAD', request, {
        errors: validationResult.error.errors
      })
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Procesar webhook
    const { eventType, payload } = body
    const { data: webhookConfig, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('event_type', eventType)
      .single()

    if (configError || !webhookConfig) {
      await logSecurityEvent('INVALID_EVENT_TYPE', request, { eventType })
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Registrar el intento
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookConfig.id,
        event_type: eventType,
        payload,
        status: 'PENDING',
        user_id: session.data.session.user.id
      })
      .select()
      .single()

    if (logError) {
      throw new Error('Failed to log webhook attempt')
    }

    // Procesar según el tipo de evento
    const webhookHandler = new WebhookHandler()
    await webhookHandler.processWebhook(eventType, payload)

    // Actualizar el estado del log
    await supabase
      .from('webhook_logs')
      .update({ status: 'SUCCESS' })
      .eq('id', logEntry.id)

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error processing webhook:', error)
    await logSecurityEvent('INTERNAL_ERROR', request, { error: error.message })
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { table, id, data } = await request.json()

  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: result })
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { table, id } = await request.json()

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

// Función auxiliar para verificar permisos de reportes
async function checkReportPermission(userId: string, reportType: string): Promise<boolean> {
  // Implementar lógica de permisos aquí
  // Por ejemplo, verificar contra una tabla de permisos en la base de datos
  return true // Temporal
} 