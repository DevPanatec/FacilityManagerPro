import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { validateWebhook } from './validator'
import { processWebhookEvent } from './processor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.WEBHOOK_SECRET!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function handleWebhook(req: Request) {
  try {
    // Validar firma del webhook
    const signature = req.headers.get('x-webhook-signature')
    const payload = await req.json()
    
    if (!validateWebhook(payload, signature!, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Procesar evento
    const result = await processWebhookEvent(payload)
    
    // Registrar en base de datos
    await supabase
      .from('webhook_events')
      .insert({
        type: payload.type,
        data: payload,
        status: result.success ? 'success' : 'error',
        error: result.error
      })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 