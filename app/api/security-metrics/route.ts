import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface SecurityMetrics {
  failed_login_attempts: number
  successful_logins: number
  password_resets: number
  suspicious_activities: number
  active_sessions: number
  mfa_usage: {
    enabled_users: number
    total_users: number
  }
  api_usage: {
    total_requests: number
    failed_requests: number
    average_response_time: number
  }
  user_activity: {
    active_users_24h: number
    active_users_7d: number
    active_users_30d: number
  }
  compliance: {
    password_policy_violations: number
    data_access_violations: number
    permission_violations: number
  }
}

// GET /api/security-metrics - Get security metrics
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters for time range
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const end_date = searchParams.get('end_date') || new Date().toISOString()

    // Get metrics from various sources
    const [
      authMetrics,
      mfaStats,
      apiStats,
      userStats,
      violationStats
    ] = await Promise.all([
      // Authentication metrics
      supabase.rpc('get_auth_metrics', { start_date, end_date }),
      
      // MFA statistics
      supabase.rpc('get_mfa_statistics'),
      
      // API usage statistics
      supabase.rpc('get_api_statistics', { start_date, end_date }),
      
      // User activity statistics
      supabase.rpc('get_user_activity_metrics', { start_date, end_date }),
      
      // Compliance violations
      supabase.rpc('get_compliance_violations', { start_date, end_date })
    ])

    // Combine all metrics
    const metrics: SecurityMetrics = {
      failed_login_attempts: authMetrics.data?.failed_attempts || 0,
      successful_logins: authMetrics.data?.successful_logins || 0,
      password_resets: authMetrics.data?.password_resets || 0,
      suspicious_activities: authMetrics.data?.suspicious_activities || 0,
      active_sessions: authMetrics.data?.active_sessions || 0,
      mfa_usage: {
        enabled_users: mfaStats.data?.enabled_users || 0,
        total_users: mfaStats.data?.total_users || 0,
      },
      api_usage: {
        total_requests: apiStats.data?.total_requests || 0,
        failed_requests: apiStats.data?.failed_requests || 0,
        average_response_time: apiStats.data?.avg_response_time || 0,
      },
      user_activity: {
        active_users_24h: userStats.data?.active_24h || 0,
        active_users_7d: userStats.data?.active_7d || 0,
        active_users_30d: userStats.data?.active_30d || 0,
      },
      compliance: {
        password_policy_violations: violationStats.data?.password_violations || 0,
        data_access_violations: violationStats.data?.access_violations || 0,
        permission_violations: violationStats.data?.permission_violations || 0,
      },
    }

    // Log metrics access
    await supabase.rpc('audit.log', {
      action: 'SECURITY_METRICS_ACCESS',
      metadata: {
        accessed_by: session.user.id,
        time_range: { start_date, end_date },
      },
    })

    return NextResponse.json({ data: metrics })

  } catch (error) {
    console.error('Error fetching security metrics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/security-metrics/alerts - Configure security alerts
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const {
      thresholds,
      notifications,
      schedule
    } = await request.json()

    // Validate alert configuration
    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json(
        { error: 'Invalid alert thresholds' },
        { status: 400 }
      )
    }

    // Update alert configuration
    const { data, error } = await supabase
      .from('security_alert_config')
      .upsert({
        thresholds,
        notifications,
        schedule,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log configuration update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_SECURITY_ALERTS',
      metadata: {
        updated_by: session.user.id,
        thresholds,
        notifications,
        schedule,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error configuring security alerts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
