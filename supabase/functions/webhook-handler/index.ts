// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  webhook_id: string
  organization_id: string
  event_type: string
  payload: any
  endpoint_url: string
  secret_key: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook logs that need to be processed
    const { data: webhooksToProcess, error: fetchError } = await supabaseClient
      .from('chat_webhook_logs')
      .select(`
        id,
        webhook_id,
        organization_id,
        event_type,
        payload,
        chat_webhooks (
          endpoint_url,
          secret_key
        )
      `)
      .is('response_status', null)
      .limit(10)

    if (fetchError) {
      throw fetchError
    }

    // Process each webhook
    const results = await Promise.all(
      webhooksToProcess.map(async (webhook) => {
        try {
          const response = await fetch(webhook.chat_webhooks.endpoint_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': webhook.chat_webhooks.secret_key,
              'X-Event-Type': webhook.event_type
            },
            body: JSON.stringify(webhook.payload)
          })

          // Update webhook log with response
          await supabaseClient
            .from('chat_webhook_logs')
            .update({
              response_status: response.status,
              response_body: await response.text()
            })
            .eq('id', webhook.id)

          return {
            id: webhook.id,
            status: 'success',
            response_status: response.status
          }
        } catch (error) {
          // Update webhook log with error
          await supabaseClient
            .from('chat_webhook_logs')
            .update({
              response_status: 500,
              response_body: error.message
            })
            .eq('id', webhook.id)

          return {
            id: webhook.id,
            status: 'error',
            error: error.message
          }
        }
      })
    )

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 