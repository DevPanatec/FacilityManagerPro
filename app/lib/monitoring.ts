import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function logError(error: Error, context: any = {}) {
  try {
    await supabase.from('error_logs').insert({
      error_message: error.message,
      error_stack: error.stack,
      context: context,
      created_at: new Date().toISOString()
    })
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}

export async function logActivity(
  userId: string,
  action: string,
  details: any = {}
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: action,
      details: details,
      created_at: new Date().toISOString()
    })
  } catch (logError) {
    console.error('Failed to log activity:', logError)
  }
}

export async function logMetric(
  name: string,
  value: number,
  tags: Record<string, string> = {}
) {
  try {
    await supabase.from('metrics').insert({
      name: name,
      value: value,
      tags: tags,
      created_at: new Date().toISOString()
    })
  } catch (logError) {
    console.error('Failed to log metric:', logError)
  }
}

export async function getSystemHealth() {
  try {
    const [
      { data: errorLogs },
      { data: activityLogs },
      { data: metrics }
    ] = await Promise.all([
      supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    return {
      error_logs: errorLogs,
      activity_logs: activityLogs,
      metrics: metrics,
      status: 'healthy'
    }
  } catch (error) {
    console.error('Failed to get system health:', error)
    return {
      error_logs: [],
      activity_logs: [],
      metrics: [],
      status: 'unhealthy'
    }
  }
} 