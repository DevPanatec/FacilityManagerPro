import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface SystemSettings {
  general: {
    site_name: string
    company_name: string
    support_email: string
    default_language: string
    default_timezone: string
    date_format: string
    time_format: string
  }
  security: {
    password_policy: {
      min_length: number
      require_uppercase: boolean
      require_lowercase: boolean
      require_numbers: boolean
      require_special_chars: boolean
      max_age_days: number
      prevent_reuse: number
    }
    session_timeout: number  // minutes
    max_login_attempts: number
    lockout_duration: number  // minutes
    mfa_settings: {
      required_for_roles: string[]
      allowed_methods: ('email' | 'authenticator' | 'sms')[]
      remember_device_days: number
    }
  }
  notifications: {
    email_notifications: {
      enabled: boolean
      from_name: string
      from_email: string
      smtp_settings?: {
        host: string
        port: number
        secure: boolean
        auth: {
          user: string
          pass: string
        }
      }
    }
    push_notifications: {
      enabled: boolean
      vapid_public_key?: string
      vapid_private_key?: string
    }
    sms_notifications: {
      enabled: boolean
      provider?: 'twilio' | 'aws-sns'
      settings?: Record<string, string>
    }
  }
  maintenance: {
    maintenance_mode: boolean
    maintenance_message?: string
    allowed_ips?: string[]
    scheduled_maintenance?: {
      start_time: string
      end_time: string
      message: string
    }
  }
  integrations: {
    enabled_integrations: string[]
    settings: Record<string, Record<string, any>>
  }
}

type SettingsSection = keyof SystemSettings
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// GET /api/settings - Get system settings
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') as SettingsSection | null

    // Build query
    let query = supabase
      .from('system_settings')
      .select('*')

    if (section) {
      query = query.eq('section', section)
    }

    const { data: settings, error } = await query

    if (error) {
      throw error
    }

    // Transform array of settings into structured object
    const structuredSettings = settings.reduce((acc, setting) => {
      const path = setting.path.split('.')
      let current = acc
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = current[path[i]] || {}
        current = current[path[i]]
      }
      current[path[path.length - 1]] = setting.value
      return acc
    }, {} as SystemSettings)

    return NextResponse.json({ data: structuredSettings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update system settings
export async function PUT(request: Request) {
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

    const { section, settings } = await request.json() as {
      section: SettingsSection
      settings: DeepPartial<SystemSettings[SettingsSection]>
    }

    if (!section || !settings) {
      return NextResponse.json(
        { error: 'Section and settings are required' },
        { status: 400 }
      )
    }

    // Flatten settings object into array of path-value pairs
    const flattenedSettings = flattenObject(settings, section)

    // Start transaction
    const { data, error } = await supabase.rpc('update_system_settings', {
      settings_array: flattenedSettings,
      updated_by: session.user.id,
    })

    if (error) {
      throw error
    }

    // Log settings update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_SYSTEM_SETTINGS',
      metadata: {
        section,
        updated_by: session.user.id,
        changes: settings,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to flatten settings object
function flattenObject(obj: any, prefix = ''): Array<{ path: string, value: any }> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [...acc, ...flattenObject(value, path)]
    }
    return [...acc, { path, value }]
  }, [] as Array<{ path: string, value: any }>)
} 
