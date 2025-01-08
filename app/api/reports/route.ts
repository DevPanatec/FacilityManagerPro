import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface ReportDefinition {
  id?: string
  name: string
  description?: string
  type: 'maintenance' | 'inspection' | 'facility' | 'financial' | 'compliance' | 'custom'
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    day?: number
    time?: string
    timezone?: string
  }
  filters: {
    date_range?: {
      start?: string
      end?: string
      relative?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year'
    }
    facilities?: string[]
    departments?: string[]
    categories?: string[]
    status?: string[]
    [key: string]: any
  }
  output_format: 'pdf' | 'excel' | 'csv' | 'json'
  template_id?: string
  recipients?: {
    users?: string[]
    roles?: string[]
    external_emails?: string[]
  }
}

interface ReportGenerationOptions {
  report_id: string
  custom_filters?: Record<string, any>
  custom_date_range?: {
    start: string
    end: string
  }
}

// GET /api/reports - List report definitions
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const includeSchedule = searchParams.get('include_schedule') === 'true'

    // Build query
    let query = supabase
      .from('report_definitions')
      .select(includeSchedule ? '*, report_schedules(*)' : '*')

    if (type) {
      query = query.eq('type', type)
    }

    const { data: reports, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data: reports })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create report definition
export async function POST(request: Request) {
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

    const reportDef = await request.json() as ReportDefinition

    // Validate report definition
    if (!reportDef.name || !reportDef.type || !reportDef.output_format) {
      return NextResponse.json(
        { error: 'Name, type, and output_format are required' },
        { status: 400 }
      )
    }

    // Create report definition
    const { data, error } = await supabase
      .from('report_definitions')
      .insert({
        ...reportDef,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // If schedule is provided, create it
    if (reportDef.schedule) {
      const { error: scheduleError } = await supabase
        .from('report_schedules')
        .insert({
          report_id: data.id,
          ...reportDef.schedule,
          created_by: session.user.id,
        })

      if (scheduleError) {
        throw scheduleError
      }
    }

    // Log report creation
    await supabase.rpc('audit.log', {
      action: 'CREATE_REPORT_DEFINITION',
      metadata: {
        report_id: data.id,
        report_name: data.name,
        report_type: data.type,
        created_by: session.user.id,
      },
    })

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/reports/:id - Update report definition
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

    const { id, updates } = await request.json() as {
      id: string
      updates: Partial<ReportDefinition>
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Update report definition
    const { data, error } = await supabase
      .from('report_definitions')
      .update({
        ...updates,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update schedule if provided
    if (updates.schedule) {
      const { error: scheduleError } = await supabase
        .from('report_schedules')
        .upsert({
          report_id: id,
          ...updates.schedule,
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        })

      if (scheduleError) {
        throw scheduleError
      }
    }

    // Log report update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_REPORT_DEFINITION',
      metadata: {
        report_id: id,
        updates,
        updated_by: session.user.id,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/:id - Delete report definition
export async function DELETE(request: Request) {
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

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Delete report (cascades to schedules)
    const { error } = await supabase
      .from('report_definitions')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Log report deletion
    await supabase.rpc('audit.log', {
      action: 'DELETE_REPORT_DEFINITION',
      metadata: {
        report_id: id,
        deleted_by: session.user.id,
      },
    })

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
