import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logSecurityEvent(
  eventType: string,
  request: Request,
  details?: any
) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabase.from('security_logs').insert({
      event_type: eventType,
      ip_address: clientIp,
      user_agent: userAgent,
      details: details || {},
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
} 