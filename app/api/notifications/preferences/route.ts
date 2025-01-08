import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  notification_types: {
    maintenance_alerts: boolean
    inspection_reminders: boolean
    task_assignments: boolean
    system_updates: boolean
    security_alerts: boolean
  }
  quiet_hours?: {
    start: string  // HH:mm format
    end: string    // HH:mm format
    timezone: string
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's notification preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preferences = await request.json() as NotificationPreferences

    // Validate preferences
    if (!isValidPreferences(preferences)) {
      return NextResponse.json(
        { error: 'Invalid notification preferences format' },
        { status: 400 }
      )
    }

    // Update preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_NOTIFICATION_PREFERENCES',
      metadata: {
        user_id: session.user.id,
        preferences: preferences,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function isValidPreferences(prefs: unknown): prefs is NotificationPreferences {
  if (typeof prefs !== 'object' || prefs === null) {
    return false
  }

  const p = prefs as NotificationPreferences

  // Check required fields
  if (typeof p.email_notifications !== 'boolean' ||
      typeof p.push_notifications !== 'boolean' ||
      typeof p.notification_types !== 'object') {
    return false
  }

  // Check notification types
  const types = p.notification_types
  if (typeof types.maintenance_alerts !== 'boolean' ||
      typeof types.inspection_reminders !== 'boolean' ||
      typeof types.task_assignments !== 'boolean' ||
      typeof types.system_updates !== 'boolean' ||
      typeof types.security_alerts !== 'boolean') {
    return false
  }

  // Check quiet hours if present
  if (p.quiet_hours !== undefined) {
    const { start, end, timezone } = p.quiet_hours
    if (typeof start !== 'string' || !isValidTimeFormat(start) ||
        typeof end !== 'string' || !isValidTimeFormat(end) ||
        typeof timezone !== 'string') {
      return false
    }
  }

  return true
}

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
} 
