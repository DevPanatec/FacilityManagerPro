// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function processEmailQueue() {
  const { data: emails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10)

  if (error) {
    console.error('Error fetching emails:', error)
    return
  }

  for (const email of emails) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify({
          from: email.from || 'noreply@facilitymanagerpro.com',
          to: email.to,
          subject: email.subject,
          html: email.html_body,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: data.id
          })
          .eq('id', email.id)

        await supabase.rpc('audit.log', {
          action: 'EMAIL_SENT',
          metadata: {
            email_id: email.id,
            recipient: email.to,
            subject: email.subject
          }
        })
      } else {
        throw new Error(data.message || 'Failed to send email')
      }
    } catch (error: unknown) {
      console.error(`Error processing email ${email.id}:`, error)
      
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'An unknown error occurred'
        })
        .eq('id', email.id)
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await processEmailQueue()
    return new Response(
      JSON.stringify({ message: 'Email queue processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}

Deno.serve(handler) 