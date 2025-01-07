import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { SMTPClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const SMTP_CONFIG = {
  hostname: Deno.env.get('SMTP_HOST') || '',
  port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
  username: Deno.env.get('SMTP_USER') || '',
  password: Deno.env.get('SMTP_PASS') || '',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

async function processEmailQueue() {
  const { data: emails, error } = await supabase
    .from('email_queue')
    .select(`
      id,
      to_email,
      variables,
      email_templates (
        subject,
        body_html,
        body_text
      )
    `)
    .eq('status', 'pending')
    .lt('retry_count', 3)
    .is('next_retry_at', null)
    .order('created_at')
    .limit(10)

  if (error) {
    console.error('Error fetching emails:', error)
    return
  }

  if (!emails?.length) {
    return
  }

  const smtp = new SMTPClient(SMTP_CONFIG)

  for (const email of emails) {
    try {
      // Update status to processing
      await supabase
        .from('email_queue')
        .update({ status: 'processing' })
        .eq('id', email.id)

      // Replace variables in templates
      let subject = email.email_templates.subject
      let bodyHtml = email.email_templates.body_html
      let bodyText = email.email_templates.body_text

      for (const [key, value] of Object.entries(email.variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        subject = subject.replace(regex, String(value))
        bodyHtml = bodyHtml.replace(regex, String(value))
        bodyText = bodyText.replace(regex, String(value))
      }

      // Send email
      await smtp.send({
        from: Deno.env.get('SMTP_FROM') || '',
        to: email.to_email,
        subject,
        content: bodyHtml,
        html: true,
      })

      // Update status to sent
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', email.id)

      // Log success
      await supabase.rpc('audit.log', {
        action: 'SECURITY_EVENT',
        metadata: {
          event_type: 'email_sent',
          email_id: email.id,
          to_email: email.to_email,
        },
      })

    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error)

      // Update retry count and status
      const retryCount = (email.retry_count || 0) + 1
      const nextRetry = retryCount < 3 
        ? new Date(Date.now() + (retryCount * 15 * 60 * 1000)).toISOString() // 15 min * retry count
        : null

      await supabase
        .from('email_queue')
        .update({
          status: retryCount >= 3 ? 'failed' : 'pending',
          retry_count: retryCount,
          next_retry_at: nextRetry,
          error_message: error.message,
        })
        .eq('id', email.id)

      // Log failure
      await supabase.rpc('audit.log', {
        action: 'SECURITY_EVENT',
        metadata: {
          event_type: 'email_failed',
          email_id: email.id,
          error: error.message,
          retry_count: retryCount,
        },
      })
    }
  }

  await smtp.close()
}

serve(async (req) => {
  try {
    // Verify request is authorized
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('WORKER_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    await processEmailQueue()
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Worker error:', error)
    return new Response(error.message, { status: 500 })
  }
}) 